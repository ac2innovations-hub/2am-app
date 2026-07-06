"use client";

// TEMPORARY diagnostics overlay for the push soft pre-prompt, gated entirely on
// isPushDebugEnabled() (?pushdebug=1). Renders nothing in normal use. Shows the
// live gate inputs on device plus a running log of which gate the pre-prompt's
// check bailed on. Remove together with lib/push/debug.ts.

import { useCallback, useEffect, useState } from "react";
import { getProfile, hydrateProfileFromSupabase } from "@/lib/profile";
import { firstChatMood } from "@/lib/push/signals";
import {
  getGateLog,
  isPushDebugEnabled,
  subscribeGateLog,
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

export default function PushDebugOverlay() {
  const [enabled, setEnabled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [log, setLog] = useState<GateLogEntry[]>([]);

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

  useEffect(() => {
    if (!isPushDebugEnabled()) return;
    setEnabled(true);
    void refresh();
    setLog(getGateLog());
    const unsub = subscribeGateLog(() => setLog(getGateLog()));
    return unsub;
  }, [refresh]);

  if (!enabled || hidden) return null;

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
            <span style={{ color: e.gate === "all_passed" ? "#8effa0" : "#ffb3b3" }}>
              {e.gate}
            </span>
          </div>
        ))}
    </div>
  );
}
