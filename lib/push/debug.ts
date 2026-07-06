"use client";

// TEMPORARY on-device diagnostics for the push soft pre-prompt.
//
// Everything here is INERT unless the debug flag is on: `?pushdebug=1` in the
// URL (persisted to localStorage so it survives SPA navigation and app
// restarts; `?pushdebug=0` clears it). `pushDebugLog()` short-circuits when the
// flag is off, so instrumentation sprinkled into the gate check has no effect
// in normal use. Remove this module + PushDebugOverlay once the pre-prompt is
// confirmed firing on device.

const DEBUG_FLAG_KEY = "2am:push:debug";
const DEBUG_URL_PARAM = "pushdebug";

export type GateLogEntry = { at: string; gate: string };

const MAX_ENTRIES = 50;
const entries: GateLogEntry[] = [];
const listeners = new Set<() => void>();

// True when the flag is set. Reading the URL param also latches it into
// localStorage so the overlay keeps working after the param falls off the URL.
export function isPushDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const param = new URLSearchParams(window.location.search).get(
      DEBUG_URL_PARAM,
    );
    if (param === "1") {
      localStorage.setItem(DEBUG_FLAG_KEY, "1");
      return true;
    }
    if (param === "0") {
      localStorage.removeItem(DEBUG_FLAG_KEY);
      return false;
    }
    return localStorage.getItem(DEBUG_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

// Append which gate failed (or "all_passed") with a timestamp. No-op unless the
// flag is on.
export function pushDebugLog(gate: string): void {
  if (!isPushDebugEnabled()) return;
  try {
    entries.push({ at: new Date().toISOString(), gate });
    if (entries.length > MAX_ENTRIES) entries.shift();
    listeners.forEach((fn) => fn());
  } catch {
    /* ignore */
  }
}

export function getGateLog(): GateLogEntry[] {
  return entries.slice();
}

export function subscribeGateLog(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
