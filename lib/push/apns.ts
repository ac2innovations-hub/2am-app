// Minimal APNs HTTP/2 sender, token-based auth (.p8 / ES256 JWT). No SDK.
//
// Two non-negotiables live here:
//   1. The APNs host is chosen from each token's stored `environment`
//      (sandbox vs production) — never a global default.
//   2. `410 Unregistered` and `400 BadDeviceToken` are returned as DISTINCT
//      named outcomes (and logged distinctly), so the caller can react
//      correctly (drop the token vs. retry the other environment).
//
// Node `nodejs` runtime only (uses node:http2 + node:crypto).

import http2 from "node:http2";
import { createPrivateKey, sign as cryptoSign, type KeyObject } from "node:crypto";

const HOSTS = {
  production: "https://api.push.apple.com",
  sandbox: "https://api.sandbox.push.apple.com",
} as const;

export type ApnsEnvironment = keyof typeof HOSTS;

export type ApnsOutcome =
  | "sent" // 200
  | "unregistered" // 410 — token is dead, remove it
  | "bad_device_token" // 400 BadDeviceToken / DeviceTokenNotForTopic — wrong env/host
  | "auth_error" // 403 — our APNs JWT/key/topic is misconfigured
  | "rate_limited" // 429 TooManyRequests
  | "payload_error" // 400 (other) — PayloadTooLarge, BadPriority, …
  | "error"; // anything else / transport failure

export type ApnsResult = {
  ok: boolean;
  outcome: ApnsOutcome;
  status?: number;
  reason?: string; // APNs `reason` string, when present
  shouldDisableToken: boolean; // terminal token failure → mark disabled
};

export type ApnsNotification = {
  title: string;
  body: string;
  data?: Record<string, string>;
  collapseId?: string;
};

type ApnsConfig = {
  keyId: string;
  teamId: string;
  bundleId: string;
  privateKey: KeyObject;
};

// `undefined` = not yet resolved; `null` = resolved-and-unavailable.
let cfgCache: ApnsConfig | null | undefined;

function loadConfig(): ApnsConfig | null {
  if (cfgCache !== undefined) return cfgCache;
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;
  const bundleId = process.env.APNS_BUNDLE_ID;
  const raw = process.env.APNS_PRIVATE_KEY;
  if (!keyId || !teamId || !bundleId || !raw) {
    cfgCache = null;
    return null;
  }
  try {
    // Env vars commonly carry the PEM with literal "\n" — normalize to real
    // newlines before parsing.
    const pem = raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
    const privateKey = createPrivateKey(pem);
    cfgCache = { keyId, teamId, bundleId, privateKey };
  } catch (err) {
    console.error(
      "[apns] APNS_PRIVATE_KEY could not be parsed: %s",
      err instanceof Error ? err.message : String(err),
    );
    cfgCache = null;
  }
  return cfgCache;
}

export function isApnsConfigured(): boolean {
  return loadConfig() !== null;
}

// Provider JWT is valid up to 60 min; APNs rejects re-mints faster than ~20
// min. Cache and refresh well inside both bounds.
const JWT_TTL_SECONDS = 40 * 60;
let cachedJwt: { token: string; iat: number } | null = null;

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function providerToken(cfg: ApnsConfig): string {
  const nowSec = Math.floor(Date.now() / 1000);
  if (cachedJwt && nowSec - cachedJwt.iat < JWT_TTL_SECONDS) {
    return cachedJwt.token;
  }
  const header = b64url(JSON.stringify({ alg: "ES256", kid: cfg.keyId }));
  const claims = b64url(JSON.stringify({ iss: cfg.teamId, iat: nowSec }));
  const signingInput = `${header}.${claims}`;
  // ES256 over P-256; `ieee-p1363` yields the raw r||s the JWS spec wants.
  const signature = cryptoSign("sha256", Buffer.from(signingInput), {
    key: cfg.privateKey,
    dsaEncoding: "ieee-p1363",
  });
  const token = `${signingInput}.${b64url(signature)}`;
  cachedJwt = { token, iat: nowSec };
  return token;
}

function post(
  host: string,
  path: string,
  headers: Record<string, string>,
  body: string,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const session = http2.connect(host);
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      session.close();
      fn();
    };
    session.on("error", (err) => finish(() => reject(err)));

    const req = session.request({ ":method": "POST", ":path": path, ...headers });
    let status = 0;
    let data = "";
    req.on("response", (h) => {
      status = Number(h[":status"]) || 0;
    });
    req.setEncoding("utf8");
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => finish(() => resolve({ status, body: data })));
    req.on("error", (err) => finish(() => reject(err)));
    req.setTimeout(10_000, () => {
      req.close();
      finish(() => reject(new Error("apns_timeout")));
    });
    req.end(body);
  });
}

function classify(status: number, reason: string): ApnsResult {
  if (status === 410) {
    console.warn(
      "[apns] outcome=unregistered status=410 reason=%s — token will be disabled",
      reason || "Unregistered",
    );
    return {
      ok: false,
      outcome: "unregistered",
      status,
      reason: reason || "Unregistered",
      shouldDisableToken: true,
    };
  }
  if (status === 400 && reason === "BadDeviceToken") {
    console.warn(
      "[apns] outcome=bad_device_token status=400 reason=BadDeviceToken — wrong env/host or malformed token",
    );
    return {
      ok: false,
      outcome: "bad_device_token",
      status,
      reason,
      shouldDisableToken: true,
    };
  }
  if (status === 400 && reason === "DeviceTokenNotForTopic") {
    // Same root cause (env/topic mismatch); let the caller retry the other
    // environment before giving up, so don't disable yet.
    console.warn(
      "[apns] outcome=bad_device_token status=400 reason=DeviceTokenNotForTopic — env/topic mismatch",
    );
    return {
      ok: false,
      outcome: "bad_device_token",
      status,
      reason,
      shouldDisableToken: false,
    };
  }
  if (status === 403) {
    console.error(
      "[apns] outcome=auth_error status=403 reason=%s — check APNS key/team/topic config",
      reason,
    );
    return { ok: false, outcome: "auth_error", status, reason, shouldDisableToken: false };
  }
  if (status === 429) {
    console.warn("[apns] outcome=rate_limited status=429 TooManyRequests");
    return { ok: false, outcome: "rate_limited", status, reason, shouldDisableToken: false };
  }
  if (status === 400) {
    console.warn("[apns] outcome=payload_error status=400 reason=%s", reason);
    return { ok: false, outcome: "payload_error", status, reason, shouldDisableToken: false };
  }
  console.warn("[apns] outcome=error status=%d reason=%s", status, reason);
  return { ok: false, outcome: "error", status, reason, shouldDisableToken: false };
}

/**
 * Send one notification to one device. The host is selected from
 * `device.environment` — the stored sandbox/production value, never a default.
 */
export async function sendApns(
  device: { token: string; environment: ApnsEnvironment },
  notification: ApnsNotification,
): Promise<ApnsResult> {
  const cfg = loadConfig();
  if (!cfg) {
    return {
      ok: false,
      outcome: "auth_error",
      reason: "apns_not_configured",
      shouldDisableToken: false,
    };
  }

  const host = HOSTS[device.environment] ?? HOSTS.production;
  const payload = JSON.stringify({
    aps: { alert: { title: notification.title, body: notification.body }, sound: "default" },
    ...(notification.data ?? {}),
  });
  const headers: Record<string, string> = {
    authorization: `bearer ${providerToken(cfg)}`,
    "apns-topic": cfg.bundleId,
    "apns-push-type": "alert",
    "apns-priority": "10",
  };
  if (notification.collapseId) headers["apns-collapse-id"] = notification.collapseId;

  try {
    const { status, body } = await post(
      host,
      `/3/device/${device.token}`,
      headers,
      payload,
    );
    if (status === 200) return { ok: true, outcome: "sent", status, shouldDisableToken: false };
    let reason = "";
    try {
      reason = (JSON.parse(body) as { reason?: string })?.reason ?? "";
    } catch {
      /* non-JSON error body */
    }
    return classify(status, reason);
  } catch (err) {
    console.error(
      "[apns] outcome=error transport failure to %s: %s",
      host,
      err instanceof Error ? err.message : String(err),
    );
    return { ok: false, outcome: "error", reason: "transport_error", shouldDisableToken: false };
  }
}
