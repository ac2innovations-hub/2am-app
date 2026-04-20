"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MylaAvatar from "@/components/MylaAvatar";
import ChatMessage from "@/components/ChatMessage";
import TypingDots from "@/components/TypingDots";
import QuickChips from "@/components/QuickChips";
import {
  appendMessages,
  createConversation,
  getActiveConversationId,
  getConversation,
  setActiveConversationId,
} from "@/lib/conversations";
import {
  getProfile,
  updateProfile,
  type LocalProfile,
} from "@/lib/profile";
import type { ChatMessage as Msg, Stage } from "@/lib/supabase/types";

const GENERIC_CHIPS = [
  "can i eat sushi?",
  "can i drink coffee?",
  "can i take tylenol?",
  "can i dye my hair?",
  "is heartburn normal?",
];

const MOOD_LINES: Record<string, string> = {
  great: "i'm feeling great today 💛",
  okay: "i'm feeling okay today.",
  meh: "feeling kind of meh today.",
  rough: "today has been rough.",
  anxious: "i'm feeling anxious.",
};

type OnboardingStep =
  | "name"
  | "stage"
  | "when"
  | "concerns"
  | "done";

function onboardingGreeting(): Msg {
  return {
    role: "assistant",
    content:
      "hey! i'm myla 💛\n\ni'm going to be here for you through this whole journey — day or night, no question too weird, no judgment ever.\n\nso tell me a little about yourself! what's your name?",
    timestamp: new Date().toISOString(),
  };
}

function now() {
  return new Date().toISOString();
}

export default function ChatClient() {
  const router = useRouter();
  const params = useSearchParams();
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [onboarding, setOnboarding] = useState<OnboardingStep>("done");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const appliedPrefill = useRef(false);

  // Hydrate profile + conversation on mount
  useEffect(() => {
    const p = getProfile();
    setProfile(p);

    if (!p || !p.onboardingComplete) {
      setOnboarding(p?.name ? (p.stage ? "when" : "stage") : "name");
      const firstMsg = onboardingGreeting();
      const convo = createConversation(firstMsg);
      setConversationId(convo.id);
      setMessages([firstMsg]);
      return;
    }

    const activeId = getActiveConversationId();
    const existing = activeId ? getConversation(activeId) : null;
    const fresh =
      new URLSearchParams(window.location.search).get("new") === "1";

    if (existing && !fresh) {
      setConversationId(existing.id);
      setMessages(existing.messages);
    } else {
      const convo = createConversation();
      setConversationId(convo.id);
      setMessages([]);
    }
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  // Handle ?q= prefill and ?mood= one-shot
  useEffect(() => {
    if (appliedPrefill.current) return;
    if (onboarding !== "done") return;
    const q = params.get("q");
    const mood = params.get("mood");
    if (q) {
      appliedPrefill.current = true;
      setInput(q);
    } else if (mood && MOOD_LINES[mood]) {
      appliedPrefill.current = true;
      // auto-send mood as a user message
      void send(MOOD_LINES[mood]);
    }
  }, [params, onboarding]);

  const showChips = useMemo(() => {
    if (onboarding !== "done") return false;
    const userTurns = messages.filter((m) => m.role === "user").length;
    return userTurns >= 1 && userTurns <= 5;
  }, [messages, onboarding]);

  const handleOnboardingReply = useCallback(
    (userText: string): Msg => {
      const text = userText.trim();
      if (onboarding === "name") {
        const name = text.replace(/[.!?]+$/, "").split(/\s+/)[0].toLowerCase();
        const next = updateProfile({ name });
        setProfile(next);
        setOnboarding("stage");
        return {
          role: "assistant",
          content: `love that, ${name} 💛\n\nso where are you on the journey? are you trying to conceive, currently pregnant, or already a mom?`,
          timestamp: now(),
        };
      }
      if (onboarding === "stage") {
        const lower = text.toLowerCase();
        let stage: Stage | null = null;
        if (
          lower.includes("postpartum") ||
          lower.includes("new mom") ||
          lower.includes("already a mom") ||
          lower.includes("had") ||
          lower.includes("newborn")
        )
          stage = "postpartum";
        else if (
          lower.includes("trying") ||
          lower.includes("ttc") ||
          lower.includes("conceive")
        )
          stage = "ttc";
        else if (
          lower.includes("pregnant") ||
          lower.includes("pregnancy") ||
          lower.includes("expecting")
        )
          stage = "pregnant";
        else stage = "pregnant";
        const next = updateProfile({ stage });
        setProfile(next);
        setOnboarding("when");
        if (stage === "pregnant") {
          return {
            role: "assistant",
            content:
              "okay, expecting mode 🤍\n\nhow far along are you? you can tell me your week, or your due date — whichever's easier.",
            timestamp: now(),
          };
        }
        if (stage === "postpartum") {
          return {
            role: "assistant",
            content:
              "welcome to the other side 🤍\n\nhow old is your little one? weeks or months is fine.",
            timestamp: now(),
          };
        }
        return {
          role: "assistant",
          content:
            "got it — we can talk about anything on your mind, cycles, timing, all of it 🌱\n\nhow long have you been trying?",
          timestamp: now(),
        };
      }
      if (onboarding === "when") {
        const stage = profile?.stage ?? "pregnant";
        if (stage === "pregnant") {
          const week = parseWeek(text);
          const dueDate = parseDueDate(text);
          const next = updateProfile({
            week: week ?? profile?.week ?? null,
            dueDate: dueDate ?? profile?.dueDate ?? null,
          });
          setProfile(next);
        } else if (stage === "postpartum") {
          const months = parseMonths(text);
          const next = updateProfile({ babyAgeMonths: months ?? null });
          setProfile(next);
        } else if (stage === "ttc") {
          const months = parseMonths(text);
          const next = updateProfile({ monthsTrying: months ?? null });
          setProfile(next);
        }
        setOnboarding("concerns");
        const prompt =
          stage === "ttc"
            ? "thanks for trusting me with that 🤍\n\nwhat's been weighing on you most?"
            : stage === "postpartum"
              ? "got it, logged 🤍\n\nand how are YOU doing — honestly?"
              : "got it, logged 🤍\n\nwhat are you most excited or nervous about?";
        return {
          role: "assistant",
          content: prompt,
          timestamp: now(),
        };
      }
      if (onboarding === "concerns") {
        const concerns = text
          .split(/[,\n]/)
          .map((s) => s.trim())
          .filter(Boolean);
        const next = updateProfile({
          concerns,
          onboardingComplete: true,
        });
        setProfile(next);
        setOnboarding("done");
        return {
          role: "assistant",
          content: `okay — i've got you${next.name ? `, ${next.name}` : ""} 💛\n\nwhenever something comes up, big or small, just tell me. i'm always up.`,
          timestamp: now(),
        };
      }
      return {
        role: "assistant",
        content: "i'm listening 💛",
        timestamp: now(),
      };
    },
    [onboarding, profile],
  );

  const send = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || sending) return;

      const userMsg: Msg = { role: "user", content: text, timestamp: now() };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setInput("");
      setSending(true);

      if (conversationId) appendMessages(conversationId, [userMsg]);

      // Onboarding short-circuit: scripted replies, no API call.
      if (onboarding !== "done") {
        setTimeout(() => {
          const reply = handleOnboardingReply(text);
          setMessages((prev) => [...prev, reply]);
          if (conversationId) appendMessages(conversationId, [reply]);
          setSending(false);
        }, 500);
        return;
      }

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            messages: nextMessages.map(({ role, content }) => ({
              role,
              content,
            })),
            userProfile: profile
              ? {
                  name: profile.name,
                  week: profile.week,
                  dueDate: profile.dueDate,
                  firstPregnancy: profile.firstPregnancy,
                  concerns: profile.concerns,
                  stage: profile.stage,
                  babyAgeMonths: profile.babyAgeMonths,
                }
              : null,
          }),
        });
        const data = (await res.json()) as { message?: string; error?: string };
        const reply: Msg = {
          role: "assistant",
          content:
            data.message ??
            data.error ??
            "hmm, i glitched for a sec. try asking me that again?",
          timestamp: now(),
        };
        setMessages((prev) => [...prev, reply]);
        if (conversationId) appendMessages(conversationId, [reply]);
      } catch {
        const reply: Msg = {
          role: "assistant",
          content:
            "i'm having trouble connecting — check your wifi and try again in a sec 🤍",
          timestamp: now(),
        };
        setMessages((prev) => [...prev, reply]);
        if (conversationId) appendMessages(conversationId, [reply]);
      } finally {
        setSending(false);
      }
    },
    [messages, sending, onboarding, handleOnboardingReply, conversationId, profile],
  );

  const canSend = input.trim().length > 0 && !sending;

  const hasProfile = !!profile?.onboardingComplete;

  return (
    <main className="relative flex min-h-svh flex-col bg-midnight">
      {/* Header */}
      <header className="safe-top sticky top-0 z-20 flex items-center justify-between border-b border-cream/5 bg-midnight/95 px-4 pb-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(hasProfile ? "/app/home" : "/app")}
            aria-label="back"
            className="rounded-full p-1 text-cream/70 active:scale-95"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M12 4l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <MylaAvatar size={36} />
          <div className="leading-tight">
            <div className="text-[15px] font-medium lowercase text-cream">
              myla
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-cream/50">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-sage" />
              always here
            </div>
          </div>
        </div>
        <div className="text-gradient-peach font-display text-lg font-black">
          2am
        </div>
      </header>

      {/* Disclaimer */}
      <div className="border-b border-cream/5 bg-navy/40 px-4 py-2">
        <p className="text-center text-[11px] leading-tight text-cream/55">
          myla is an ai companion, not a doctor. always consult your provider
          for medical decisions.
        </p>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="messages-mask flex-1 overflow-y-auto px-4 pt-4 pb-4"
      >
        <div className="flex flex-col gap-5">
          {messages.map((m, i) => (
            <ChatMessage key={i} role={m.role} content={m.content} />
          ))}
          {sending && (
            <div className="flex items-start gap-2">
              <div className="mt-1 shrink-0">
                <MylaAvatar size={28} />
              </div>
              <TypingDots />
            </div>
          )}
          {messages.length === 0 && !sending && (
            <div className="mt-12 flex flex-col items-center gap-3 text-center">
              <MylaAvatar size={56} />
              <p className="text-cream/80">
                hey{profile?.name ? `, ${profile.name}` : ""} — what&apos;s
                up?
              </p>
              <p className="text-sm text-cream/50">
                ask me anything. no judgment.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick chips */}
      {showChips && (
        <div className="border-t border-cream/5 bg-midnight px-4 pt-3">
          <QuickChips
            suggestions={GENERIC_CHIPS}
            onPick={(s) => send(s)}
            disabled={sending}
          />
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSend) void send(input);
        }}
        className="safe-bottom sticky bottom-0 z-20 border-t border-cream/5 bg-midnight/95 px-4 pt-3 backdrop-blur"
      >
        <div className="flex items-center gap-2 rounded-full bg-navy px-4 py-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ask myla anything..."
            autoComplete="off"
            autoCapitalize="off"
            className="flex-1 bg-transparent py-2 text-[15px] text-cream placeholder:lowercase placeholder:text-cream/40 focus:outline-none"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label="send"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-peach-gradient text-midnight shadow-glow transition active:scale-95 disabled:opacity-40"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path
                d="M3 10l14-6-6 14-2-6-6-2z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
        {hasProfile && (
          <div className="mt-2 flex justify-center">
            <Link
              href="/app/home"
              onClick={() => setActiveConversationId(conversationId)}
              className="font-mono text-[10px] uppercase tracking-[0.22em] text-cream/40 hover:text-cream/60"
            >
              ← home
            </Link>
          </div>
        )}
      </form>
    </main>
  );
}

function parseWeek(text: string): number | null {
  const m = text.match(/(\d{1,2})\s*(?:weeks?|wks?|w\b)/i) ?? text.match(/^(\d{1,2})$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  if (n < 1 || n > 42) return null;
  return n;
}

function parseDueDate(text: string): string | null {
  const d = new Date(text);
  if (!Number.isNaN(d.getTime()) && d.getTime() > Date.now()) {
    return d.toISOString().slice(0, 10);
  }
  return null;
}

function parseMonths(text: string): number | null {
  const m = text.match(/(\d{1,2})\s*(?:months?|mo\b)/i) ?? text.match(/^(\d{1,2})$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n >= 0 && n <= 60 ? n : null;
}
