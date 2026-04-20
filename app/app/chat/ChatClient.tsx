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

const CHIPS_BY_STAGE: Record<Stage, string[]> = {
  ttc: [
    "does ovulation tracking actually work?",
    "how long should we try before seeing a doctor?",
    "can i drink alcohol while trying?",
    "what supplements should i take?",
    "is it normal to feel jealous of pregnant friends?",
  ],
  pregnant: [
    "can i eat sushi?",
    "can i drink coffee?",
    "is this discharge normal?",
    "can i take tylenol?",
    "why do i feel so emotional?",
  ],
  postpartum: [
    "is my baby's sleep normal?",
    "do i have ppd or am i just tired?",
    "can i drink coffee while breastfeeding?",
    "when should my baby start solids?",
    "why won't my baby latch?",
  ],
};

function chipsForStage(stage: Stage | null | undefined): string[] {
  // During onboarding stage isn't set yet — fall back to pregnant chips.
  return CHIPS_BY_STAGE[stage ?? "pregnant"];
}

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

  // Parse the user's onboarding reply, save to profile, advance the state,
  // and return (a) the directive that tells Myla what to ask next and
  // (b) the freshly-updated profile to send along with the API call.
  // No scripted Myla text — she writes her own reply from the directive.
  const processOnboardingInput = useCallback(
    (
      userText: string,
    ): {
      directive: string;
      updatedProfile: LocalProfile;
    } => {
      const text = userText.trim();

      if (onboarding === "name") {
        const name = parseName(text);
        const next = updateProfile({ name });
        setProfile(next);
        setOnboarding("stage");
        return {
          updatedProfile: next,
          directive: `The user just told you their name is "${name || text}". Acknowledge warmly and uniquely — do not use canned phrases like "love that" or "nice to meet you". Then ask where they are on the journey: trying to conceive, currently pregnant, or already a mom. Keep it casual and conversational.`,
        };
      }

      if (onboarding === "stage") {
        const lower = text.toLowerCase();
        let stage: Stage;
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
        const stageDirective =
          stage === "pregnant"
            ? "The user just told you they're currently pregnant. Acknowledge warmly and uniquely, then ask how far along they are — they can answer with a week number or a due date, whichever is easier."
            : stage === "postpartum"
              ? "The user just told you they're already a new mom. Acknowledge warmly and uniquely, then ask how old their little one is — weeks or months are both fine."
              : "The user just told you they're trying to conceive. Acknowledge warmly and uniquely (never the same phrasing twice), then gently ask how long they've been trying. Be supportive and not clinical.";
        return { updatedProfile: next, directive: stageDirective };
      }

      if (onboarding === "when") {
        const stage = profile?.stage ?? "pregnant";
        let next: LocalProfile;
        let detailLine: string;
        if (stage === "pregnant") {
          const week = parseWeek(text);
          const dueDate = parseDueDate(text);
          next = updateProfile({
            week: week ?? profile?.week ?? null,
            dueDate: dueDate ?? profile?.dueDate ?? null,
          });
          detailLine = `they're currently at week ${next.week ?? "(unspecified)"}${next.dueDate ? `, due ${next.dueDate}` : ""}`;
        } else if (stage === "postpartum") {
          const months = parseMonths(text);
          next = updateProfile({ babyAgeMonths: months ?? null });
          detailLine = `their baby is ${next.babyAgeMonths !== null ? `${next.babyAgeMonths} months old` : "a newborn (age unspecified)"}`;
        } else {
          const months = parseMonths(text);
          next = updateProfile({ monthsTrying: months ?? null });
          // DEBUG: temporary — remove once TTC parser is verified end-to-end.
          console.log(
            "[2am debug] TTC onboarding: raw=%o parsedMonths=%o saved=%o",
            text,
            months,
            next.monthsTrying,
          );
          detailLine = `they've been trying for ${next.monthsTrying !== null ? `${next.monthsTrying} months` : "a while (duration unspecified)"}`;
        }
        setProfile(next);
        setOnboarding("concerns");
        const nextQuestion =
          stage === "ttc"
            ? "Then ask what's been weighing on them most lately. Be extra gentle if they've been trying for a while."
            : stage === "postpartum"
              ? "Then ask how THEY are doing — honestly. Make sure this question is about HER, not the baby. Emphasize it's a question about how she is personally."
              : "Then ask what they're most excited or nervous about.";
        return {
          updatedProfile: next,
          directive: `The user just shared that ${detailLine}. Acknowledge warmly and uniquely. ${nextQuestion}`,
        };
      }

      if (onboarding === "concerns") {
        const concerns = text
          .split(/[,\n]/)
          .map((s) => s.trim())
          .filter(Boolean);
        const next = updateProfile({ concerns, onboardingComplete: true });
        setProfile(next);
        setOnboarding("done");
        return {
          updatedProfile: next,
          directive: `The user just shared what's been on their mind: "${text}". This is the end of onboarding. Acknowledge what they shared warmly and specifically (reference what they said — don't be generic). Then close the onboarding: let them know you're here whenever, day or night, no question too small. Never use canned phrases like "i've got you" — make it feel personal.`,
        };
      }

      return {
        updatedProfile: profile ?? updateProfile({}),
        directive: "Acknowledge what the user said warmly.",
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

      // Onboarding: parse + save + advance state. Let Myla write the reply.
      let directive: string | null = null;
      let profileForApi: LocalProfile | null = profile;
      if (onboarding !== "done") {
        const r = processOnboardingInput(text);
        directive = r.directive;
        profileForApi = r.updatedProfile;
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
            userProfile: profileForApi
              ? {
                  name: profileForApi.name,
                  week: profileForApi.week,
                  dueDate: profileForApi.dueDate,
                  firstPregnancy: profileForApi.firstPregnancy,
                  concerns: profileForApi.concerns,
                  stage: profileForApi.stage,
                  babyAgeMonths: profileForApi.babyAgeMonths,
                  monthsTrying: profileForApi.monthsTrying,
                }
              : null,
            onboardingDirective: directive,
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
    [
      messages,
      sending,
      onboarding,
      processOnboardingInput,
      conversationId,
      profile,
    ],
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
          myla is a friend, not a doctor. always consult your provider
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
            suggestions={chipsForStage(profile?.stage ?? null)}
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

// Extract a first name from free-text replies like "ali", "my name is ali",
// "i'm ali", "call me ali", "ali!", etc. Handles straight + curly apostrophes,
// trailing punctuation, and emoji. Falls back to the last remaining word so a
// bare "ali" still returns "ali".
export function parseName(raw: string): string {
  if (!raw) return "";
  const norm = raw
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z\s']/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!norm) return "";

  const patterns: RegExp[] = [
    /\bmy\s+name(?:\s+is|'s)\s+([a-z]+)/,
    /\bthey\s+call\s+me\s+([a-z]+)/,
    /\bcall\s+me\s+([a-z]+)/,
    /\bi\s+go\s+by\s+([a-z]+)/,
    /\bname'?s\s+([a-z]+)/,
    /\bthis\s+is\s+([a-z]+)/,
    /\bi\s+am\s+([a-z]+)/,
    /\bi'?m\s+([a-z]+)/,
    /\bit'?s\s+([a-z]+)/,
  ];
  for (const re of patterns) {
    const m = norm.match(re);
    if (m && m[1]) return m[1];
  }

  const words = norm.split(" ").filter(Boolean);
  return words[words.length - 1] ?? "";
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

const WORD_NUMBERS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
};

const NUM_OR_WORD =
  "(\\d+(?:\\.\\d+)?|a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)";

function toNum(s: string): number | null {
  if (/^\d+(\.\d+)?$/.test(s)) return parseFloat(s);
  const key = s.toLowerCase();
  return key in WORD_NUMBERS ? WORD_NUMBERS[key] : null;
}

function clampMonths(n: number): number | null {
  const rounded = Math.round(n);
  return rounded >= 0 && rounded <= 120 ? rounded : null;
}

// Parse duration replies like "2 years", "a year", "1.5 years",
// "a year and a half", "6 months", "18 months", bare "2", "about 2 years",
// "like a year", "over a year", "2 years and 3 months". Returns months.
export function parseMonths(text: string): number | null {
  if (!text) return null;
  const t = text.toLowerCase().replace(/[’‘]/g, "'").trim();

  // "X years and a half" / "X years and half"
  const yrsHalf = t.match(
    new RegExp(`\\b${NUM_OR_WORD}\\s+years?\\s+(?:and\\s+)?(?:a\\s+half|half)\\b`),
  );
  if (yrsHalf) {
    const y = toNum(yrsHalf[1]);
    if (y !== null) return clampMonths(y * 12 + 6);
  }

  // "X years and Y months"
  const yrsMo = t.match(
    new RegExp(`\\b${NUM_OR_WORD}\\s+years?\\s+(?:and\\s+)?${NUM_OR_WORD}\\s+months?\\b`),
  );
  if (yrsMo) {
    const y = toNum(yrsMo[1]);
    const m = toNum(yrsMo[2]);
    if (y !== null && m !== null) return clampMonths(y * 12 + m);
  }

  // "X years" / "a year" / "one year" / "1.5 years" (about/like/over/etc. all OK — regex is anchored on the number+years phrase)
  const years = t.match(new RegExp(`\\b${NUM_OR_WORD}\\s+years?\\b`));
  if (years) {
    const y = toNum(years[1]);
    if (y !== null) return clampMonths(y * 12);
  }

  // "X months" / "X month" / "X mo"
  const months = t.match(new RegExp(`\\b${NUM_OR_WORD}\\s+(?:months?|mo)\\b`));
  if (months) {
    const m = toNum(months[1]);
    if (m !== null) return clampMonths(m);
  }

  // Bare number → months
  const bare = t.match(/^(\d+(?:\.\d+)?)$/);
  if (bare) return clampMonths(parseFloat(bare[1]));

  return null;
}
