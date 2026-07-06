"use client";

// Tiny localStorage signals shared between ChatClient (which knows when the
// first post-onboarding message is sent and the first conversation's mood) and
// the PushPrePrompt sheet (which decides whether to surface). Browser-only;
// every accessor is null-safe and never throws.

export const PUSH_DECIDED_KEY = "2am:push:decided"; // user answered the soft prompt
export const FIRST_MOOD_KEY = "2am:chat:firstMood"; // seeding mood of first convo
export const FIRST_SENT_KEY = "2am:chat:sentFirst"; // first post-onboarding send

// Dispatched whenever a signal the pre-prompt depends on changes (the first
// post-onboarding message is sent, or the profile finishes hydrating from
// Supabase). PushPrePrompt listens for this and re-evaluates, so the sheet is
// reactive instead of mount-once — no polling.
export const PUSH_RECHECK_EVENT = "2am:push:recheck";

export function notifyPushRecheck(): void {
  try {
    window.dispatchEvent(new Event(PUSH_RECHECK_EVENT));
  } catch {
    /* ignore (SSR / no window) */
  }
}

// Record the first conversation's seeding mood, once. Later moods don't
// overwrite it — the gate cares about the FIRST conversation.
export function markFirstChatMood(mood: string): void {
  try {
    if (!localStorage.getItem(FIRST_MOOD_KEY)) {
      localStorage.setItem(FIRST_MOOD_KEY, mood);
    }
  } catch {
    /* ignore */
  }
}

// Mark that the user has sent their first real (post-onboarding) message.
export function markFirstMessageSent(): void {
  try {
    if (!localStorage.getItem(FIRST_SENT_KEY)) {
      localStorage.setItem(FIRST_SENT_KEY, "1");
      notifyPushRecheck();
    }
  } catch {
    /* ignore */
  }
}

export function hasSentFirstMessage(): boolean {
  try {
    return !!localStorage.getItem(FIRST_SENT_KEY);
  } catch {
    return false;
  }
}

export function prePromptDecided(): boolean {
  try {
    return !!localStorage.getItem(PUSH_DECIDED_KEY);
  } catch {
    return false;
  }
}

export function markPrePromptDecided(): void {
  try {
    localStorage.setItem(PUSH_DECIDED_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function firstChatMood(): string | null {
  try {
    return localStorage.getItem(FIRST_MOOD_KEY);
  } catch {
    return null;
  }
}
