"use client";

// Namespace-wide wipe of everything 2am stores on the device.
//
// Every key this app writes to localStorage/sessionStorage is prefixed "2am:"
// (conversations, profile, the anon chat token, onboarding + push flags). This
// clears the whole namespace by prefix rather than by an explicit key list, so
// a key added later is covered without anyone remembering to update the delete
// path — the failure mode of a hardcoded list is a transcript left on the
// device after the user asked us to delete it.
//
// Used by the account-delete flow. NOT used by plain sign-out, which
// deliberately keeps device-local UX flags (e.g. 2am:push:decided) so signing
// back in doesn't re-prompt for things the user already answered.

export const STORAGE_NAMESPACE = "2am:";

function clearNamespace(store: Storage): number {
  // Collect first, then remove: removing during the index walk shifts the
  // remaining keys down and would skip every other match.
  const keys: string[] = [];
  for (let i = 0; i < store.length; i++) {
    const key = store.key(i);
    if (key && key.startsWith(STORAGE_NAMESPACE)) keys.push(key);
  }
  for (const key of keys) store.removeItem(key);
  return keys.length;
}

// Removes every 2am:* key from both localStorage and sessionStorage. Never
// throws — storage can be unavailable (private mode, disabled cookies) and a
// failure here must not block the redirect that follows account deletion.
// Returns the number of keys removed (0 if storage was unavailable).
export function clearAllLocalData(): number {
  if (typeof window === "undefined") return 0;
  let removed = 0;
  try {
    removed += clearNamespace(window.localStorage);
  } catch {
    // ignore — storage unavailable
  }
  try {
    removed += clearNamespace(window.sessionStorage);
  } catch {
    // ignore — storage unavailable
  }
  return removed;
}
