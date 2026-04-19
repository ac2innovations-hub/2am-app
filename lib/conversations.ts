"use client";

import type { ChatMessage } from "@/lib/supabase/types";

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

function genId() {
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
}

export function replaceConversation(convo: LocalConversation) {
  const all = readAll();
  const idx = all.findIndex((c) => c.id === convo.id);
  if (idx === -1) all.unshift(convo);
  else all[idx] = convo;
  writeAll(all);
}

function titleFrom(text: string): string {
  const t = text.trim().toLowerCase().replace(/\s+/g, " ");
  return t.length > 48 ? t.slice(0, 48) + "…" : t;
}
