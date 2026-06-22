"use client";

import { createClient } from "@/lib/supabase/client";
import type { ChatMessage, Conversation } from "@/lib/supabase/types";

export type LocalConversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
};

const LIST_KEY = "2am:conversations";
const ACTIVE_KEY = "2am:activeConversation";

function readAll(): LocalConversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LIST_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LocalConversation[];
  } catch {
    return [];
  }
}

function writeAll(list: LocalConversation[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LIST_KEY, JSON.stringify(list));
}

export function listConversations(): LocalConversation[] {
  return readAll()
    .slice()
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
}

export function getConversation(id: string): LocalConversation | null {
  return readAll().find((c) => c.id === id) ?? null;
}

export function getActiveConversationId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveConversationId(id: string | null) {
  if (typeof window === "undefined") return;
  if (id === null) localStorage.removeItem(ACTIVE_KEY);
  else localStorage.setItem(ACTIVE_KEY, id);
}

// Hand-off marker: the anonymous try-Myla flow tags the conversation it created
// so ChatClient knows, after signup, to continue THAT thread (and re-own it to
// the new account) instead of starting a fresh onboarding thread on top of it.
const PENDING_ANON_KEY = "2am:pendingAnonConversation";

export function setPendingAnonConversation(id: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PENDING_ANON_KEY, id);
  } catch {
    // ignore
  }
}

export function getPendingAnonConversation(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(PENDING_ANON_KEY);
  } catch {
    return null;
  }
}

export function clearPendingAnonConversation() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PENDING_ANON_KEY);
  } catch {
    // ignore
  }
}

function genId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createConversation(firstMessage?: ChatMessage): LocalConversation {
  const now = new Date().toISOString();
  const convo: LocalConversation = {
    id: genId(),
    title: firstMessage ? titleFrom(firstMessage.content) : "new chat",
    messages: firstMessage ? [firstMessage] : [],
    createdAt: now,
    updatedAt: now,
  };
  const all = readAll();
  all.unshift(convo);
  writeAll(all);
  setActiveConversationId(convo.id);
  void mirrorToSupabase(convo);
  return convo;
}

export function appendMessages(id: string, messages: ChatMessage[]) {
  const all = readAll();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return;
  const c = all[idx];
  c.messages = [...c.messages, ...messages];
  c.updatedAt = new Date().toISOString();
  if (c.title === "new chat" || c.title === "untitled") {
    const firstUser = c.messages.find((m) => m.role === "user");
    if (firstUser) c.title = titleFrom(firstUser.content);
  }
  all[idx] = c;
  writeAll(all);
  void mirrorToSupabase(c);
}

export function replaceConversation(convo: LocalConversation) {
  const all = readAll();
  const idx = all.findIndex((c) => c.id === convo.id);
  if (idx === -1) all.unshift(convo);
  else all[idx] = convo;
  writeAll(all);
  void mirrorToSupabase(convo);
}

export function deleteConversation(id: string) {
  const all = readAll().filter((c) => c.id !== id);
  writeAll(all);
  if (getActiveConversationId() === id) setActiveConversationId(null);
  void deleteFromSupabase(id);
}

function titleFrom(text: string): string {
  const t = text.trim().toLowerCase().replace(/\s+/g, " ");
  return t.length > 48 ? t.slice(0, 48) + "…" : t;
}

// Pull conversations from Supabase into localStorage on mount. Silent on
// any failure — localStorage continues to serve the UI.
export async function hydrateConversationsFromSupabase(): Promise<LocalConversation[]> {
  if (typeof window === "undefined") return [];
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return listConversations();

    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error || !data) return listConversations();

    // Union by id. Remote is the baseline; a local copy only wins when it's
    // strictly newer (an edit made offline). Conversations that exist only
    // locally were created while signed-out and never mirrored — keep them
    // and push them up, so signing up doesn't wipe chat history the user
    // already has on this device. (Without this, `data` is [] for a brand
    // new user and the old code did writeAll([]), erasing it.)
    const remote: LocalConversation[] = data.map(rowToLocal);
    const byId = new Map<string, LocalConversation>();
    for (const c of remote) byId.set(c.id, c);

    const toPushUp: LocalConversation[] = [];
    for (const c of readAll()) {
      const r = byId.get(c.id);
      const localIsNewer =
        r &&
        new Date(c.updatedAt).getTime() > new Date(r.updatedAt).getTime();
      if (!r || localIsNewer) {
        byId.set(c.id, c);
        toPushUp.push(c);
      }
    }

    const merged = Array.from(byId.values()).sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    writeAll(merged);

    // Fire-and-forget: catch the server up on local-only / locally-newer
    // conversations. Errors are swallowed inside mirrorToSupabase.
    for (const c of toPushUp) void mirrorToSupabase(c);

    return merged;
  } catch {
    return listConversations();
  }
}

function rowToLocal(row: Conversation): LocalConversation {
  return {
    id: row.id,
    title: row.title,
    messages: Array.isArray(row.messages) ? row.messages : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function mirrorToSupabase(convo: LocalConversation) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("conversations").upsert(
      {
        id: convo.id,
        user_id: user.id,
        title: convo.title,
        messages: convo.messages,
      },
      { onConflict: "id" },
    );
    if (error) {
      // localStorage still has the write, but surface it — a silent failure
      // here is how an anon transcript would fail to migrate.
      console.warn(
        "[conversations] mirror failed for %s: %s",
        convo.id,
        error.message,
      );
    }
  } catch (err) {
    console.warn(
      "[conversations] mirror threw for %s: %s",
      convo.id,
      err instanceof Error ? err.message : String(err),
    );
  }
}

// Persist a conversation to the DB now, awaited, and confirm it landed by
// reading the row back. Used when continuing an anonymous conversation after
// signup so the transcript is durably written to — and owned by — the new user,
// not just held in localStorage. RLS-correct: the row is inserted with
// user_id = auth.uid(), which the "conversations self write" insert policy
// requires (the anon row was never written, so this is the first insert under
// the new owner — no cross-user ownership transfer, which RLS would reject).
export async function persistConversationNow(id: string): Promise<boolean> {
  const convo = getConversation(id);
  if (!convo) return false;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.from("conversations").upsert(
      {
        id: convo.id,
        user_id: user.id,
        title: convo.title,
        messages: convo.messages,
      },
      { onConflict: "id" },
    );
    if (error) {
      console.warn(
        "[conversations] persist failed for %s: %s",
        convo.id,
        error.message,
      );
      return false;
    }

    // Verify: the messages actually landed on the new user's row.
    const { data: check, error: checkErr } = await supabase
      .from("conversations")
      .select("id, messages")
      .eq("id", convo.id)
      .eq("user_id", user.id)
      .maybeSingle();
    const landed = check && Array.isArray(check.messages) ? check.messages.length : 0;
    if (checkErr || !check || landed < convo.messages.length) {
      console.warn(
        "[conversations] persist verify failed for %s: %s (%d/%d messages)",
        convo.id,
        checkErr?.message ?? (check ? "count mismatch" : "row not found for user"),
        landed,
        convo.messages.length,
      );
      return false;
    }
    return true;
  } catch (err) {
    console.warn(
      "[conversations] persist threw for %s: %s",
      id,
      err instanceof Error ? err.message : String(err),
    );
    return false;
  }
}

async function deleteFromSupabase(id: string) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("conversations").delete().eq("id", id).eq("user_id", user.id);
  } catch {
    // No-op.
  }
}
