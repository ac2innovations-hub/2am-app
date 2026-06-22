"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AiConsentScreen from "@/components/AiConsentScreen";
import ChatMessage from "@/components/ChatMessage";
import MylaAvatar from "@/components/MylaAvatar";
import { createClient } from "@/lib/supabase/client";
import { acceptAiConsent } from "@/lib/profile";
import {
  appendMessages,
  createConversation,
  getConversation,
} from "@/lib/conversations";
import type { ChatMessage as Msg } from "@/lib/supabase/types";

// Anonymous "try Myla before signup" chat. Deliberately separate from the
// authenticated ChatClient: no onboarding, no Supabase user, a small free
// message budget gated by a server-signed token (see /api/anon/start and the
// anon branch in /api/chat). The conversation is written to localStorage via
// the same store the logged-in app uses, so it migrates onto the new account
// after signup (hydrateConversationsFromSupabase pushes local-only convos up).

const TOKEN_KEY = "2am:anonToken";
const OPENING =
  "hey, i'm myla 💛 i'm here for whatever's on your mind — trying, pregnancy, or life as a new mom. no judgment, no google rabbit holes. what's going on?";

function now() {
  return new Date().toISOString();
}

type StoredToken = {
  token: string;
  budget: number;
  expiresAt: number;
  conversationId: string;
};

export default function TryMylaClient() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [consented, setConsented] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Logged-in users don't belong in the anon flow → send them to their chat.
  // Otherwise restore an in-progress anon session (token + transcript) so a
  // reload doesn't force re-consent.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled) return;
        if (user) {
          router.replace("/app/chat");
          return;
        }
      } catch {
        // proceed as anon
      }

      // If the anonymous path isn't configured (ANON_CHAT_SECRET unset), fall
      // through to signup so "meet myla" still works — and auto-upgrade to the
      // try flow once the secret is set.
      try {
        const res = await fetch("/api/anon/start", { method: "GET" });
        const data = (await res.json().catch(() => ({}))) as {
          enabled?: boolean;
        };
        if (cancelled) return;
        if (!res.ok || !data.enabled) {
          router.replace("/app/auth");
          return;
        }
      } catch {
        if (!cancelled) router.replace("/app/auth");
        return;
      }

      try {
        const raw = sessionStorage.getItem(TOKEN_KEY);
        if (raw) {
          const s = JSON.parse(raw) as StoredToken;
          if (s?.token && s.expiresAt > Date.now() && s.conversationId) {
            const convo = getConversation(s.conversationId);
            if (convo) {
              setToken(s.token);
              setConversationId(s.conversationId);
              setMessages(convo.messages);
              setConsented(true);
            }
          }
        }
      } catch {
        // ignore — fall back to a fresh consent
      }

      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Consent → mint a token → seed the opening message into a localStorage
  // conversation (so it survives signup).
  const start = useCallback(async () => {
    setStarting(true);
    setError(null);
    try {
      // Records consent locally; mirrors to Supabase only once signed in.
      await acceptAiConsent();

      const res = await fetch("/api/anon/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ consent: true }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        token?: string;
        budget?: number;
        expiresAt?: number;
        error?: string;
      };
      if (!res.ok || !data.token) {
        setError(
          "couldn't start a chat just now — try again, or log in if you have an account.",
        );
        setStarting(false);
        return;
      }

      const opening: Msg = { role: "assistant", content: OPENING, timestamp: now() };
      const convo = createConversation();
      appendMessages(convo.id, [opening]);

      try {
        const stored: StoredToken = {
          token: data.token,
          budget: data.budget ?? 0,
          expiresAt: data.expiresAt ?? Date.now(),
          conversationId: convo.id,
        };
        sessionStorage.setItem(TOKEN_KEY, JSON.stringify(stored));
      } catch {
        // sessionStorage unavailable — flow still works in-memory this session.
      }

      setToken(data.token);
      setRemaining(data.budget ?? null);
      setConversationId(convo.id);
      setMessages([opening]);
      setConsented(true);
    } catch {
      setError("something went wrong — try again?");
    }
    setStarting(false);
  }, []);

  const budgetDone = remaining !== null && remaining <= 0;
  const canSend = input.trim().length > 0 && !sending && !budgetDone && !!token;

  const send = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || sending || budgetDone || !token || !conversationId) return;

      const userMsg: Msg = { role: "user", content: text, timestamp: now() };
      const next = [...messages, userMsg];
      setMessages(next);
      setInput("");
      appendMessages(conversationId, [userMsg]);
      setSending(true);
      setError(null);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-anon-token": token,
          },
          body: JSON.stringify({
            messages: next.map(({ role, content }) => ({ role, content })),
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          message?: string;
          error?: string;
          anonRemaining?: number;
        };

        // Out of free messages (server is the source of truth) → soft gate.
        if (res.status === 402 || data.error === "budget_exhausted") {
          setRemaining(0);
          setSending(false);
          return;
        }

        if (!res.ok) {
          const reply: Msg = {
            role: "assistant",
            content:
              "myla's being a little slow right now — try sending that again in a sec 💛",
            timestamp: now(),
          };
          setMessages((prev) => [...prev, reply]);
          setSending(false);
          return;
        }

        const reply: Msg = {
          role: "assistant",
          content: data.message ?? "hmm, myla got a little lost. try rephrasing? 💛",
          timestamp: now(),
        };
        setMessages((prev) => [...prev, reply]);
        appendMessages(conversationId, [reply]);
        if (typeof data.anonRemaining === "number") {
          setRemaining(data.anonRemaining);
        }
      } catch {
        const reply: Msg = {
          role: "assistant",
          content:
            "looks like something went wrong on our end — try again? 💛",
          timestamp: now(),
        };
        setMessages((prev) => [...prev, reply]);
      }
      setSending(false);
    },
    [messages, sending, budgetDone, token, conversationId],
  );

  if (!ready) {
    return <main className="min-h-svh bg-midnight" />;
  }

  if (!consented) {
    return (
      <>
        <AiConsentScreen onAccept={start} loginHref="/app/auth" />
        {(starting || error) && (
          <div className="fixed inset-x-0 bottom-6 z-[60] flex justify-center px-6">
            <p className="text-center text-[13px] text-cream/70">
              {starting ? "starting…" : error}
            </p>
          </div>
        )}
      </>
    );
  }

  return (
    <main className="relative flex min-h-[100svh] min-h-[100dvh] flex-col bg-midnight">
      {/* Header */}
      <header className="safe-top sticky top-0 z-20 flex items-center justify-between border-b border-cream/5 bg-midnight/95 px-4 pb-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <MylaAvatar size={36} />
          <div className="leading-tight">
            <div className="text-[15px] font-medium lowercase text-cream">myla</div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-cream/50">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-sage" />
              just trying it out
            </div>
          </div>
        </div>
        <Link
          href="/app/auth"
          className="font-mono text-[10px] uppercase tracking-[0.22em] text-cream/50 underline decoration-cream/20 underline-offset-4 hover:text-cream/80"
        >
          log in
        </Link>
      </header>

      {/* Messages */}
      <div className="messages-mask flex-1 overflow-y-auto px-4 pt-4 pb-32">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.map((m, i) => (
            <ChatMessage key={i} role={m.role} content={m.content} />
          ))}
          {sending && (
            <div className="px-1 font-mono text-[11px] lowercase tracking-wide text-cream/40">
              myla is typing…
            </div>
          )}
          <div ref={endRef} className="h-2" />
        </div>
      </div>

      {/* Soft gate replaces the input once the free budget is spent. */}
      {budgetDone ? (
        <div className="safe-bottom sticky bottom-0 z-20 border-t border-cream/10 bg-midnight/95 px-5 pb-6 pt-5 backdrop-blur">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[15px] leading-relaxed text-cream/90">
              create a free account to keep talking and save this conversation.
            </p>
            <Link
              href="/app/auth"
              className="mt-4 flex w-full items-center justify-center rounded-full bg-peach-gradient py-3.5 text-[15px] font-semibold text-midnight shadow-glow transition active:scale-[0.99]"
            >
              create a free account
            </Link>
            <p className="mt-3 text-[13px] text-cream/60">
              already have one?{" "}
              <Link
                href="/app/auth"
                className="text-peach underline underline-offset-2 hover:text-coral"
              >
                log in
              </Link>
            </p>
          </div>
        </div>
      ) : (
        <form
          className="safe-bottom sticky bottom-0 z-20 border-t border-cream/10 bg-midnight/95 px-4 pb-4 pt-3 backdrop-blur"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSend) void send(input);
          }}
        >
          <div className="mx-auto flex max-w-2xl items-center gap-2 rounded-full border border-cream/15 bg-navy/60 px-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="ask myla anything..."
              aria-label="message"
              className="flex-1 bg-transparent py-3 text-[15px] text-cream placeholder:lowercase placeholder:text-cream/40 focus:outline-none"
              disabled={sending}
            />
            <button
              type="submit"
              aria-label="send"
              disabled={!canSend}
              className="shrink-0 rounded-full bg-peach-gradient px-4 py-2 text-[13px] font-semibold text-midnight transition active:scale-95 disabled:opacity-40"
            >
              send
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
