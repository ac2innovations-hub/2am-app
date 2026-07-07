"use client";

// TEMPORARY diagnostics overlay for the push soft pre-prompt, gated entirely on
// isPushDebugEnabled() (?pushdebug=1). Renders nothing in normal use. Shows the
// live gate inputs on device plus a running log of which gate the pre-prompt's
// check bailed on. Remove together with lib/push/debug.ts.

import { useCallback, useEffect, useRef, useState } from "react";
import { getProfile, hydrateProfileFromSupabase } from "@/lib/profile";
import { firstChatMood, notifyPushRecheck } from "@/lib/push/signals";
import {
  getGateLog,
  isPushDebugEnabled,
  subscribeGateLog,
  togglePushDebug,
  type GateLogEntry,
} from "@/lib/push/debug";

type Snapshot = {
  native: string;
  plugin: string;
  decided: string | null;
  sentFirst: string | null;
  firstMood: string | null;
  onboardingLocal: string;
  onboardingHydrated: string;
  eligibility: string;
};

const box: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 9999,
  maxHeight: "70vh",
  overflowY: "auto",
  background: "rgba(0,0,0,0.92)",
  color: "#b7f7c2",
  font: "11px/1.45 ui-monospace, Menlo, monospace",
  padding: "10px 12px calc(10px + env(safe-area-inset-top))",
  borderBottom: "1px solid rgba(255,255,255,0.15)",
  WebkitUserSelect: "text",
  userSelect: "text",
};

function ls(k: string): string | null {
  try {
    return localStorage.getItem(k);
  } catch {
    return "(err)";
  }
}

// Color a gate-log line: red for failures/errors, green for success, blue for
// the verbatim network/permission traces, salmon for a suppressing gate.
function logColor(gate: string): string {
  if (/threw|HTTP [45]\d\d|registrationError/i.test(gate)) return "#ff9d9d";
  if (gate === "all_passed" || /HTTP 2\d\d/.test(gate)) return "#8effa0";
  if (/requestPermissions|registration event|prompt\(|register →/.test(gate))
    return "#cfd8ff";
  return "#ffb3b3";
}

export default function PushDebugOverlay() {
  const [enabled, setEnabled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [log, setLog] = useState<GateLogEntry[]>([]);
  const taps = useRef<number[]>([]);

  const refresh = useCallback(async () => {
    const cap = (
      window as {
        Capacitor?: {
          isNativePlatform?: () => boolean;
          isPluginAvailable?: (n: string) => boolean;
        };
      }
    ).Capacitor;
    const native = !cap
      ? "no Capacitor"
      : typeof cap.isNativePlatform === "function"
        ? String(cap.isNativePlatform())
        : "(no isNativePlatform)";
    const plugin =
      cap && typeof cap.isPluginAvailable === "function"
        ? String(cap.isPluginAvailable("PushNotifications"))
        : "(no isPluginAvailable)";

    const onboardingLocal = String(
      getProfile()?.onboardingComplete ?? "(no profile)",
    );
    let onboardingHydrated = "(pending)";
    try {
      const h = await hydrateProfileFromSupabase();
      onboardingHydrated = String(h?.onboardingComplete ?? "(no profile)");
    } catch {
      onboardingHydrated = "(hydrate err)";
    }

    let eligibility = "(pending)";
    try {
      const mood = firstChatMood();
      const q = mood ? `?mood=${encodeURIComponent(mood)}` : "";
      const res = await fetch(`/api/push/eligibility${q}`);
      const json = await res.json().catch(() => ({}));
      eligibility = `HTTP ${res.status} · ${JSON.stringify(json)}`;
    } catch {
      eligibility = "(fetch err)";
    }

    setSnap({
      native,
      plugin,
      decided: ls("2am:push:decided"),
      sentFirst: ls("2am:chat:sentFirst"),
      firstMood: ls("2am:chat:firstMood"),
      onboardingLocal,
      onboardingHydrated,
      eligibility,
    });
  }, []);

  // Reflect the latched flag on mount.
  useEffect(() => {
    if (isPushDebugEnabled()) setEnabled(true);
  }, []);

  // While enabled, collect a snapshot and stream the gate log.
  useEffect(() => {
    if (!enabled) return;
    setHidden(false);
    void refresh();
    setLog(getGateLog());
    const unsub = subscribeGateLog(() => setLog(getGateLog()));
    return unsub;
  }, [enabled, refresh]);

  // 5 taps within 2.5s on the invisible top-center zone toggle the flag. This
  // is the only trigger reachable inside a fixed-server.url WKWebView.
  const onTap = () => {
    const now = Date.now();
    const recent = [...taps.current, now].filter((t) => now - t < 2500);
    taps.current = recent;
    if (recent.length >= 5) {
      taps.current = [];
      const on = togglePushDebug();
      setEnabled(on);
      if (!on) {
        setSnap(null);
        setLog([]);
      }
    }
  };

  // Clear ONLY the burned one-shot flag (leave sentFirst / firstMood) and nudge
  // the pre-prompt to re-evaluate, so we can re-capture the POST/registration
  // trace without a fresh install.
  const resetDecided = () => {
    try {
      localStorage.removeItem("2am:push:decided");
    } catch {
      /* ignore */
    }
    notifyPushRecheck();
    void refresh();
  };

  // The tap zone is ALWAYS mounted (even when disabled) so the gesture can turn
  // diagnostics back on. It sits over dead header space and is transparent.
  const tapZone = (
    <div
      onClick={onTap}
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: 110,
        height: 56,
        zIndex: 10000,
        background: "transparent",
      }}
    />
  );

  if (!enabled || hidden) return tapZone;

  const rows: Array<[string, React.ReactNode]> = snap
    ? [
        ["isNativePlatform()", snap.native],
        ["isPluginAvailable(Push)", snap.plugin],
        ["2am:push:decided", String(snap.decided)],
        ["2am:chat:sentFirst", String(snap.sentFirst)],
        ["2am:chat:firstMood", String(snap.firstMood)],
        ["onboardingComplete (local)", snap.onboardingLocal],
        ["onboardingComplete (hydrated)", snap.onboardingHydrated],
        ["/api/push/eligibility", snap.eligibility],
      ]
    : [];

  return (
    <>
      {tapZone}
      <div style={box} role="region" aria-label="push diagnostics">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
          color: "#fff",
        }}
      >
        <strong>push pre-prompt diagnostics</strong>
        <span>
          <button
            type="button"
            onClick={resetDecided}
            style={{ color: "#8effa0", marginRight: 12, background: "none", border: 0 }}
          >
            reset decided
          </button>
          <button
            type="button"
            onClick={() => void refresh()}
            style={{ color: "#ffd479", marginRight: 12, background: "none", border: 0 }}
          >
            refresh
          </button>
          <button
            type="button"
            onClick={() => setHidden(true)}
            style={{ color: "#ff9d9d", background: "none", border: 0 }}
          >
            hide
          </button>
        </span>
      </div>

      {!snap && <div>collecting…</div>}
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: "flex", gap: 8 }}>
          <span style={{ color: "#7fb0ff", minWidth: 168, flexShrink: 0 }}>{k}</span>
          <span style={{ wordBreak: "break-all" }}>{v}</span>
        </div>
      ))}

      <div style={{ marginTop: 8, color: "#fff" }}>
        gate check log ({log.length})
      </div>
      {log.length === 0 && (
        <div style={{ color: "#888" }}>
          (no gate check has run yet — navigate to chat / send a message)
        </div>
      )}
      {log
        .slice()
        .reverse()
        .map((e, i) => (
          <div key={`${e.at}-${i}`} style={{ display: "flex", gap: 8 }}>
            <span style={{ color: "#888", flexShrink: 0 }}>
              {e.at.slice(11, 23)}
            </span>
            <span
              style={{
                color: logColor(e.gate),
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {e.gate}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
