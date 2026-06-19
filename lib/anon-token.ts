// Server-signed, short-lived token for the anonymous "try Myla before signup"
// flow. It lets a logged-out visitor call /api/chat for a small message budget
// WITHOUT reopening the endpoint to unauthenticated POSTs. HMAC-SHA256 over a
// base64url payload (same trust model as the HEALTHCHECK_SECRET gate), so no
// JWT dependency is needed. The secret lives only on the server.
//
// The token is stateless except for a per-jti message counter in the shared
// store (see incrementCounter in lib/rate-limiter.ts), which enforces the budget.

import { createHmac, randomUUID, timingSafeEqual } from "crypto";

export const ANON_TOKEN_TTL_SECONDS = 30 * 60; // 30 minutes
export const ANON_MSG_BUDGET = 3; // free exchanges per token (tunable)

export type AnonTokenPayload = {
  v: 1;
  jti: string;
  iat: number; // unix seconds
  exp: number; // unix seconds
  budget: number;
  consent: true; // tokens are only issued after the consent screen is accepted
};

function getSecret(): string | null {
  const s = process.env.ANON_CHAT_SECRET;
  return s && s.length > 0 ? s : null;
}

function sign(payloadB64: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(payloadB64).digest();
}

// Returns null if ANON_CHAT_SECRET isn't configured (fail closed).
export function issueAnonToken(
  nowSeconds: number,
): { token: string; payload: AnonTokenPayload } | null {
  const secret = getSecret();
  if (!secret) return null;
  const payload: AnonTokenPayload = {
    v: 1,
    jti: randomUUID(),
    iat: nowSeconds,
    exp: nowSeconds + ANON_TOKEN_TTL_SECONDS,
    budget: ANON_MSG_BUDGET,
    consent: true,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sigB64 = sign(payloadB64, secret).toString("base64url");
  return { token: `${payloadB64}.${sigB64}`, payload };
}

// Returns the payload for a valid, unexpired token, else null (invalid
// signature, malformed, expired, or secret not configured all → null).
export function verifyAnonToken(
  token: string | null | undefined,
  nowSeconds: number,
): AnonTokenPayload | null {
  if (!token) return null;
  const secret = getSecret();
  if (!secret) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;

  let expected: Buffer;
  let provided: Buffer;
  try {
    expected = sign(payloadB64, secret);
    provided = Buffer.from(sigB64, "base64url");
  } catch {
    return null;
  }
  if (expected.length !== provided.length) return null;
  if (!timingSafeEqual(expected, provided)) return null;

  let payload: AnonTokenPayload;
  try {
    payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8"),
    ) as AnonTokenPayload;
  } catch {
    return null;
  }

  if (
    !payload ||
    payload.v !== 1 ||
    typeof payload.jti !== "string" ||
    typeof payload.exp !== "number" ||
    typeof payload.budget !== "number" ||
    payload.consent !== true
  ) {
    return null;
  }
  if (payload.exp <= nowSeconds) return null; // expired

  return payload;
}
