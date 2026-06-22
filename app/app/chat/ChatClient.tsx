"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MylaAvatar from "@/components/MylaAvatar";
import ChatMessage from "@/components/ChatMessage";
import TypingDots from "@/components/TypingDots";
import QuickChips from "@/components/QuickChips";
import AiConsentScreen from "@/components/AiConsentScreen";
import { track } from "@/lib/analytics";
import { maybeRequestReview } from "@/lib/rating";
import {
  appendMessages,
  createConversation,
  deleteConversation,
  getActiveConversationId,
  getConversation,
  hydrateConversationsFromSupabase,
  listConversations,
  setActiveConversationId,
  getPendingAnonConversation,
  clearPendingAnonConversation,
  persistConversationNow,
} from "@/lib/conversations";
import {
  acceptAiConsent,
  getProfile,
  hydrateProfileFromSupabase,
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

// Myla opens the conversation with one of these lines when the user taps
// a mood emoji on the home hub. The user then responds naturally — the
// chat is seeded with Myla already acknowledging the mood, not the user
// having auto-sent "i'm feeling rough".
const MOOD_OPENERS: Record<string, (name: string) => string> = {
  great: (n) =>
    `hey ${n} — happy to hear you're feeling great today 💛 anything good happening, or just want to chat?`,
  okay: (n) =>
    `hi ${n} — okay is a perfectly valid mood 🤍 anything on your mind today?`,
  meh: (n) =>
    `hey ${n} — meh days are real. want to talk about what's making today feel flat?`,
  rough: (n) =>
    `hey ${n} — sounds like today's been rough. want to talk about what's going on?`,
  anxious: (n) =>
    `hey ${n} — i'm glad you told me. anxious can be a lot. what's swirling for you right now?`,
};

type OnboardingStep =
  | "name"
  | "stage"
  | "when"
  | "baby_name"
  | "baby_sex"
  | "concerns"
  | "done";

// Exact text of the onboarding opener, shared so orphan-thread cleanup can
// match a greeting-only conversation precisely.
const ONBOARDING_GREETING_CONTENT =
  "hey! i'm myla 💛\n\ni'm going to be here for you through this whole journey — day or night, no question too weird, no judgment ever.\n\nso tell me a little about yourself! what's your name?";

function onboardingGreeting(): Msg {
  return {
    role: "assistant",
    content: ONBOARDING_GREETING_CONTENT,
    timestamp: new Date().toISOString(),
  };
}

// A conversation that is ONLY the onboarding greeting with no user reply — an
// abandoned onboarding thread (e.g. one the earlier bug spawned on top of a
// continued conversation). Matched exactly so we never delete a real thread.
function isOrphanOnboardingThread(messages: Msg[]): boolean {
  return (
    messages.length > 0 &&
    !messages.some((m) => m.role === "user") &&
    messages.some((m) => m.content === ONBOARDING_GREETING_CONTENT)
  );
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
  // Set when a continued anonymous conversation has no stage yet — drives the
  // one-time gentle stage ask woven into the continued thread (stage-first).
  const [needsStage, setNeedsStage] = useState(false);
  const stageAsked = useRef(false);
  // Set when a continued thread already revealed the user's stage — drives a
  // one-time confirmation ("got you at 23 weeks 💛 — that right?") instead of a
  // cold ask.
  const [pendingConfirm, setPendingConfirm] = useState<{
    name?: string | null;
    stage: Stage;
    week?: number | null;
  } | null>(null);
  // Short window after continuing where we still absorb stage/week the user
  // states or corrects in the next turn or two.
  const profileReview = useRef(0);
  // Last user message that didn't land a reply. When set, the Myla
  // error bubble is decorated with a "tap to retry" affordance. Cleared
  // on the next successful send or when a fresh user message is typed.
  const [retryableText, setRetryableText] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasAutoScrolled = useRef(false);
  const appliedPrefill = useRef(false);

  // Hydrate profile + conversation on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Pull from Supabase first (falls back to localStorage on failure)
      // so users signing in on a new device don't restart onboarding.
      const [remoteProfile] = await Promise.all([
        hydrateProfileFromSupabase(),
        hydrateConversationsFromSupabase(),
      ]);
      if (cancelled) return;
      const p = remoteProfile ?? getProfile();
      setProfile(p);

      // Trigger Myla's opening greeting whenever the authoritative signals
      // (name, stage) are missing. The Supabase trigger auto-creates a
      // profile row at signup with empty fields, so a brand new user will
      // always have p.name === null here — don't treat the row's existence
      // as "onboarded". Advance mid-onboarding returners based on what
      // they've already answered.
      if (!p || !p.name || !p.stage) {
        // Continue a real conversation (the just-migrated anon one, or an
        // existing active thread) instead of starting onboarding on top of it.
        const pendingId = getPendingAnonConversation();
        const pending = pendingId ? getConversation(pendingId) : null;
        const activeId = getActiveConversationId();
        const active = activeId ? getConversation(activeId) : null;
        const hasUserTurn = (c: typeof pending) =>
          !!c && c.messages.some((m) => m.role === "user");
        // Fall back to the most recent real (has-user-turn) conversation, so we
        // recover a migrated thread even if the active pointer was left on an
        // orphan onboarding thread by the earlier bug.
        const recentReal =
          listConversations().find((c) =>
            c.messages.some((m) => m.role === "user"),
          ) ?? null;
        const continueConvo = hasUserTurn(pending)
          ? pending!
          : hasUserTurn(active)
            ? active!
            : recentReal;

        if (continueConvo) {
          const fromPending = continueConvo === pending;
          if (fromPending) clearPendingAnonConversation();

          // Capture name/stage/weeks from the transcript and persist them, so
          // the dashboard/tracker work and Myla confirms rather than re-asks.
          const patch = captureFromTranscript(continueConvo.messages, p);
          const cp = Object.keys(patch).length > 0 ? updateProfile(patch) : p;
          setProfile(cp);

          setConversationId(continueConvo.id);
          setMessages(continueConvo.messages);
          setActiveConversationId(continueConvo.id);
          setOnboarding("done");
          profileReview.current = 2;

          if (cp?.stage) {
            setPendingConfirm({
              name: cp.name ?? undefined,
              stage: cp.stage,
              week: cp.week ?? undefined,
            });
            setNeedsStage(false);
          } else {
            setNeedsStage(true);
          }

          // Remove any orphan onboarding thread the earlier bug spawned.
          for (const c of listConversations()) {
            if (
              c.id !== continueConvo.id &&
              isOrphanOnboardingThread(c.messages)
            ) {
              deleteConversation(c.id);
            }
          }

          // First continuation: durably re-own consent + the captured profile +
          // the transcript to the new user's rows — awaited and read-back verified.
          if (fromPending) {
            await acceptAiConsent();
            const ok = await persistConversationNow(continueConvo.id);
            if (!ok) {
              console.warn(
                "[chat] anon conversation did not fully persist to the new account",
              );
            }
          }
          return;
        }

        setOnboarding(p?.name ? (p.stage ? "when" : "stage") : "name");
        const firstMsg = onboardingGreeting();
        const convo = createConversation(firstMsg);
        setConversationId(convo.id);
        setMessages([firstMsg]);
        return;
      }

      const sp = new URLSearchParams(window.location.search);
      const fresh = sp.get("new") === "1";
      const checkinParam = sp.get("checkin");
      const moodParam = sp.get("mood");

      // Seeded conversation: home-hub "tap to reply" on a check-in, or a
      // mood emoji tap. Start a new convo with Myla's opening message
      // already visible; the user types their reply directly.
      if (fresh && (checkinParam || moodParam)) {
        const seedText = checkinParam
          ? checkinParam
          : MOOD_OPENERS[moodParam!]?.(p.name ?? "you");
        if (seedText) {
          const seed: Msg = {
            role: "assistant",
            content: seedText,
            timestamp: new Date().toISOString(),
          };
          const convo = createConversation(seed);
          setConversationId(convo.id);
          setMessages([seed]);
          return;
        }
      }

      const activeId = getActiveConversationId();
      const existing = activeId ? getConversation(activeId) : null;

      if (existing && !fresh) {
        setConversationId(existing.id);
        setMessages(existing.messages);
      } else {
        const convo = createConversation();
        setConversationId(convo.id);
        setMessages([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Anchor-based auto-scroll. Fire on every messages/sending change.
  // - rAF: run after React has flushed layout for this render
  // - 100ms follow-up: catch post-paint layout shifts (font metrics
  //   swapping in, late image/asset reflow, iOS keyboard opening)
  // First fire on mount snaps instantly; everything after is smooth.
  useEffect(() => {
    const scrollNow = (behavior: ScrollBehavior) => {
      bottomRef.current?.scrollIntoView({ behavior, block: "end" });
    };
    const initialBehavior: ScrollBehavior = hasAutoScrolled.current
      ? "smooth"
      : "auto";
    const raf = requestAnimationFrame(() => scrollNow(initialBehavior));
    const settleTimer = setTimeout(() => scrollNow("smooth"), 100);
    hasAutoScrolled.current = true;
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settleTimer);
    };
  }, [messages, sending]);

  // ?q= prefill puts a question in the input box (from the can-i page).
  // Mood + checkin are handled at mount by seeding Myla's first message,
  // so no work here for those.
  useEffect(() => {
    if (appliedPrefill.current) return;
    if (onboarding !== "done") return;
    const q = params.get("q");
    if (q) {
      appliedPrefill.current = true;
      setInput(q);
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
        const patch: Partial<LocalProfile> = {};
        // Only patch name when we actually parsed one — passing an empty
        // string would clobber a previously-saved name.
        if (name) patch.name = name;

        // Users often pack stage + timing into the same first reply
        // ("i'm sarah, 16 weeks" / "5 weeks pregnant"). Capture what we
        // can now so it isn't dropped and we don't re-ask. detectStage
        // defaults to "pregnant" with no signal, so gate on hasStageSignal.
        let combinedDetail: string | null = null;
        let detectedStage: Stage | null = null;
        if (hasStageSignal(text)) {
          detectedStage = detectStage(text);
          patch.stage = detectedStage;

          if (detectedStage === "pregnant") {
            const week = parseWeek(text);
            const dueDate = parseDueDate(text);
            if (week !== null) {
              patch.week = week;
              combinedDetail = `they're at week ${week}`;
            } else if (dueDate) {
              patch.dueDate = dueDate;
              combinedDetail = `they're pregnant, due ${dueDate}`;
            }
          } else if (detectedStage === "postpartum") {
            // Only accept a months value here if the text actually carries
            // postpartum age context — guards against "5 months" alone
            // (could be months-trying or weeks-pregnant otherwise).
            if (
              /\b(?:postpartum|postnatal|newborn|old|baby\s+is|baby\s+was|gave\s+birth|delivered|breastfeeding|nursing|fourth\s+trimester|4th\s+trimester)\b/i.test(text)
            ) {
              const months = parseMonths(text);
              if (months !== null) {
                patch.babyAgeMonths = months;
                combinedDetail = `their baby is ${months} months old`;
              }
            }
          } else {
            const months = parseMonths(text);
            if (months !== null) {
              patch.monthsTrying = months;
              combinedDetail = `they've been trying for ${months} months`;
            }
          }
        }

        const next = updateProfile(patch);
        setProfile(next);

        // No name yet — stay at the "name" step regardless of what stage
        // / timing we picked up. The data we did capture is already saved,
        // so the next turn just needs to give us a name.
        if (!name) {
          const stageAck =
            detectedStage === "pregnant"
              ? "you now know they're pregnant"
              : detectedStage === "postpartum"
                ? "you now know they're a new mom"
                : detectedStage === "ttc"
                  ? "you now know they're trying to conceive"
                  : null;
          const ackBits = [stageAck, combinedDetail].filter(Boolean).join(" — ");
          const lead = ackBits
            ? `${ackBits}. Briefly acknowledge that warmly, then `
            : "";
          return {
            updatedProfile: next,
            directive: `${lead}gently ask for their name — they didn't share one yet. Keep it warm and conversational, like a friend who just wants to know what to call them. Do NOT re-ask the stage or timing.`,
          };
        }

        // Name + stage + timing in one reply → skip the when-step.
        if (combinedDetail) {
          if (detectedStage === "postpartum") {
            setOnboarding("baby_name");
            return {
              updatedProfile: next,
              directive: `The user told you in one go that their name is "${name}" and ${combinedDetail}. Do NOT ask the baby's age again. Acknowledge warmly using their name, then warmly ask about the baby's name (something like "does your little one have a name?"). Keep it short. Do NOT ask about gender or sex yet.`,
            };
          }
          setOnboarding("concerns");
          const concernsAsk =
            detectedStage === "ttc"
              ? "ask what's been weighing on them most lately. Be extra gentle if they've been trying for a while."
              : "ask what they're most excited or nervous about.";
          return {
            updatedProfile: next,
            directive: `The user told you in one go that their name is "${name}" and ${combinedDetail}. Do NOT re-ask the stage or how far along / how long. Acknowledge warmly using their name and what they shared, then ${concernsAsk}`,
          };
        }

        // Name + stage but no timing → skip "stage", go straight to "when".
        if (detectedStage) {
          setOnboarding("when");
          const whenAsk =
            detectedStage === "pregnant"
              ? "ask how far along they are — a week number or a due date is fine."
              : detectedStage === "postpartum"
                ? "ask how old their little one is — weeks or months are both fine."
                : "gently ask how long they've been trying. Be supportive, not clinical.";
          return {
            updatedProfile: next,
            directive: `The user told you their name is "${name}" and shared where they are on the journey. Acknowledge warmly using their name, then ${whenAsk}`,
          };
        }

        // Plain name reply — the original flow.
        setOnboarding("stage");
        return {
          updatedProfile: next,
          directive: `The user just told you their name is "${name}". Acknowledge warmly and uniquely — do not use canned phrases like "love that" or "nice to meet you". Then ask where they are on the journey: trying to conceive, currently pregnant, or already a mom. Keep it casual and conversational.`,
        };
      }

      if (onboarding === "stage") {
        const stage = detectStage(text);
        const patch: Partial<LocalProfile> = { stage };
        let combinedDetail: string | null = null;

        // If the user's reply *also* carried their timing in one turn
        // ("5 weeks", "baby is 6 months", "trying for a year"), capture it
        // now so we can skip the when-step and not ask them again.
        if (stage === "pregnant") {
          const week = parseWeek(text);
          const dueDate = parseDueDate(text);
          if (week !== null) {
            patch.week = week;
            combinedDetail = `they're pregnant and currently at week ${week}`;
          } else if (dueDate) {
            patch.dueDate = dueDate;
            combinedDetail = `they're pregnant, due ${dueDate}`;
          }
        } else if (stage === "postpartum") {
          // Only accept a bare months number here if the reply clearly
          // carries postpartum context — otherwise "5 months" could mean
          // months-pregnant or months-trying.
          if (/\b(?:postpartum|postnatal|old|baby\s+is|baby\s+was|gave\s+birth|delivered|newborn|breastfeeding|nursing|fourth\s+trimester|4th\s+trimester)\b/i.test(text)) {
            const months = parseMonths(text);
            if (months !== null) {
              patch.babyAgeMonths = months;
              combinedDetail = `they're a new mom, their baby is ${months} months old`;
            }
          }
          // A user answering stage+age might also slip the baby's name or
          // sex into the same turn ("new mom, baby boy, 3 months, his name
          // is owen"). Pull anything we can to skip ahead.
          const earlyName = parseBabyName(text);
          if (earlyName) patch.babyName = earlyName;
          const earlySex = parseBabySex(text);
          if (earlySex) patch.babySex = earlySex;
        } else {
          // ttc
          const months = parseMonths(text);
          if (months !== null) {
            patch.monthsTrying = months;
            combinedDetail = `they've been trying to conceive for ${months} months`;
          }
        }

        const next = updateProfile(patch);
        setProfile(next);

        if (combinedDetail) {
          if (stage === "postpartum") {
            // Postpartum branches by what the fast-path already captured.
            if (!next.babyName) {
              setOnboarding("baby_name");
              return {
                updatedProfile: next,
                directive: `The user just told you in one go that ${combinedDetail}. Do NOT ask how old the baby is — they already told you. Acknowledge the age warmly and uniquely, then warmly ask about the baby's name (something like "does your little one have a name?"). Keep it short. Do NOT ask about gender or sex yet.`,
              };
            }
            if (!next.babySex) {
              setOnboarding("baby_sex");
              return {
                updatedProfile: next,
                directive: `The user just told you in one go that ${combinedDetail} and their baby's name is ${next.babyName}. Do NOT ask the age or the name again — they already told you. Briefly celebrate the name ("${next.babyName}" — one short warm sentence), then ask naturally "boy or girl?" in your own words.`,
              };
            }
            // Age + name + sex all captured in one reply — pivot to mom.
            setOnboarding("concerns");
            return {
              updatedProfile: next,
              directive: `The user just told you in one go that ${combinedDetail}, their baby's name is ${next.babyName}, and the baby is a ${next.babySex}. Do NOT re-ask any of these. Briefly acknowledge (use the name "${next.babyName}" naturally, one short sentence), then pivot firmly to HER: "okay now tell me about YOU — how are you actually doing?" This pivot is critical. Everyone in her life asks about the baby. You are the one who asks about HER. Make her feel seen.`,
            };
          }

          // Pregnant / ttc fast-path — go to concerns.
          setOnboarding("concerns");
          const concernsAsk =
            stage === "ttc"
              ? "ask what's been weighing on them most lately. Be extra gentle if they've been trying for a while."
              : "ask what they're most excited or nervous about.";
          return {
            updatedProfile: next,
            directive: `The user just told you in one go that ${combinedDetail}. Do NOT ask how far along they are or how long they've been trying — they already told you. Acknowledge the stage AND the timing warmly and uniquely, then ${concernsAsk}`,
          };
        }

        // Stage only — ask the when-question next turn.
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
          detailLine = `they've been trying for ${next.monthsTrying !== null ? `${next.monthsTrying} months` : "a while (duration unspecified)"}`;
        }
        setProfile(next);

        // Postpartum gets a dedicated baby step between "when" and
        // "concerns" — one warm, light question about the baby (name),
        // then the concerns step is the pivot to HER.
        if (stage === "postpartum") {
          setOnboarding("baby_name");
          return {
            updatedProfile: next,
            directive: `The user just shared that ${detailLine}. Acknowledge the age warmly and uniquely, then warmly ask about the baby's name (something like "does your little one have a name?"). Keep it short and light. Do NOT ask about gender or sex yet — that's a later step.`,
          };
        }

        setOnboarding("concerns");
        const nextQuestion =
          stage === "ttc"
            ? "Then ask what's been weighing on them most lately. Be extra gentle if they've been trying for a while."
            : "Then ask what they're most excited or nervous about.";
        return {
          updatedProfile: next,
          directive: `The user just shared that ${detailLine}. Acknowledge warmly and uniquely. ${nextQuestion}`,
        };
      }

      if (onboarding === "baby_name") {
        const babyName = parseBabyName(text);
        const next = updateProfile({ babyName: babyName ?? null });
        setProfile(next);
        setOnboarding("baby_sex");
        const namePhrase = babyName
          ? `their baby's name is ${babyName}`
          : `they didn't share a name (that's fine — don't push)`;
        return {
          updatedProfile: next,
          directive: `The user just shared something about their baby: "${text}". You now know that ${namePhrase}. Briefly celebrate the name${babyName ? ` ("${babyName}" — something light and warm, one short sentence)` : ""}, then ask naturally "boy or girl?" in your own words. Keep it casual and warm. Do NOT pivot to her yet — that comes after.`,
        };
      }

      if (onboarding === "baby_sex") {
        const babySex = parseBabySex(text);
        const next = updateProfile({ babySex: babySex ?? null });
        setProfile(next);
        setOnboarding("concerns");
        const babyName = next.babyName;
        const sexPhrase = babySex
          ? `their baby is ${babySex === "surprise" || babySex === "not sharing" ? `(${babySex})` : `a ${babySex}`}`
          : `they didn't name a sex (don't assume — stay neutral)`;
        return {
          updatedProfile: next,
          directive: `The user just shared the baby's sex: "${text}". You now know that ${sexPhrase}${babyName ? ` and the baby's name is ${babyName}` : ""}. Briefly acknowledge (${babyName ? `use the name "${babyName}"` : `keep it warm and neutral`}, one short sentence). Then pivot firmly to HER: "okay now tell me about YOU — how are you actually doing?" This pivot is critical. Everyone in her life asks about the baby. You are the one who asks about HER. Make her feel seen.`,
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
        track("onboarding_completed", { stage: next.stage ?? "unknown" });
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
    async (rawText: string, opts?: { isRetry?: boolean }) => {
      const text = rawText.trim();
      if (!text || sending) return;
      // Gate: no messages may be sent to Anthropic until the user has
      // consented. The overlay normally blocks the input, but guard here too.
      if (profile && !profile.aiConsent) return;

      let nextMessages: Msg[];
      if (opts?.isRetry) {
        // Retry: user message is already in the transcript. Strip the
        // trailing Myla error bubble (kept in state only, never
        // persisted) and re-send with the same conversation context.
        nextMessages =
          messages.length > 0 &&
          messages[messages.length - 1].role === "assistant"
            ? messages.slice(0, -1)
            : messages;
        setMessages(nextMessages);
      } else {
        const userMsg: Msg = { role: "user", content: text, timestamp: now() };
        nextMessages = [...messages, userMsg];
        setMessages(nextMessages);
        setInput("");
        if (conversationId) appendMessages(conversationId, [userMsg]);
      }
      setRetryableText(null);
      setSending(true);

      // Analytics: counts only — message content is never sent.
      if (!opts?.isRetry) {
        track("message_sent", { during_onboarding: onboarding !== "done" });
        if (typeof window !== "undefined" && !localStorage.getItem("2am_first_msg")) {
          localStorage.setItem("2am_first_msg", "1");
          track("first_message_sent");
        }
      }

      // Onboarding: parse + save + advance state. Let Myla write the reply.
      let directive: string | null = null;
      let profileForApi: LocalProfile | null = profile;
      if (!opts?.isRetry && onboarding !== "done") {
        const r = processOnboardingInput(text);
        directive = r.directive;
        profileForApi = r.updatedProfile;
      } else if (!opts?.isRetry && profile) {
        // Post-onboarding: passive extraction. If the user casually mentions
        // the baby's name or sex in free chat — e.g. after a milestone
        // check-in on the home hub — capture it so future turns can
        // personalize without re-asking.
        const passivePatch: Partial<LocalProfile> = {};
        if (!profile.babyName) {
          const n = parseBabyName(text);
          if (n) passivePatch.babyName = n;
        }
        if (!profile.babySex) {
          const s = parseBabySex(text);
          if (s) passivePatch.babySex = s;
        }
        if (Object.keys(passivePatch).length > 0) {
          const updated = updateProfile(passivePatch);
          setProfile(updated);
          profileForApi = updated;
        }

        // Continued-anon profile completion. For a couple of turns after
        // continuing, absorb any stage/weeks the user states or corrects
        // (guarded so a throwaway line doesn't mis-set stage).
        if (profileReview.current > 0) {
          profileReview.current -= 1;
          const cap = captureFromText(text, profileForApi);
          if (Object.keys(cap).length > 0) {
            const updated = updateProfile(cap);
            setProfile(updated);
            profileForApi = updated;
            if (cap.stage) setNeedsStage(false);
          }
        }

        // One-time woven-in moment: confirm what we already captured, or — if
        // stage is still unknown — ask for it gently (loss-aware), never a
        // questionnaire. If never captured, the dashboard nudge is the fallback.
        if (pendingConfirm) {
          directive = buildConfirmDirective(pendingConfirm);
          setPendingConfirm(null);
        } else if (needsStage && !stageAsked.current) {
          stageAsked.current = true;
          directive =
            "The user started this conversation before creating an account and just signed up — keep going naturally where they left off, and treat the messages above as real shared context. You don't yet know their stage (trying to conceive, pregnant, or postpartum / new mom). If the conversation makes it reasonably clear, gently CONFIRM it in one short sentence. If it's genuinely unclear, gently ask once, with warm, loss-aware phrasing. Ask at most once, weave it into your reply, and never run a list of onboarding questions.";
        }
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
        const data = (await res.json().catch(() => ({}))) as {
          message?: string;
          error?: string;
        };
        if (!res.ok) {
          // Friendly error bubble. Held in React state only — not
          // persisted to localStorage/Supabase — so retrying cleanly
          // replaces it with the real reply.
          const reply: Msg = {
            role: "assistant",
            content:
              data.message ??
              "myla's being a little slow right now — try sending that again in a sec 💛",
            timestamp: now(),
          };
          setMessages((prev) => [...prev, reply]);
          if (res.status !== 429) setRetryableText(text);
          return;
        }
        const reply: Msg = {
          role: "assistant",
          content:
            data.message ??
            "hmm, myla got a little lost. try rephrasing? 💛",
          timestamp: now(),
        };
        setMessages((prev) => [...prev, reply]);
        if (conversationId) appendMessages(conversationId, [reply]);
        // Native-only App Store rating prompt: fires after an engaged,
        // non-crisis exchange. No-op on web and during onboarding.
        if (onboarding === "done") {
          maybeRequestReview({
            userMessageCount: nextMessages.filter((m) => m.role === "user")
              .length,
            latestReply: reply.content,
          });
        }
      } catch {
        const reply: Msg = {
          role: "assistant",
          content:
            "looks like something went wrong on our end — try again? 💛",
          timestamp: now(),
        };
        setMessages((prev) => [...prev, reply]);
        setRetryableText(text);
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

  const retry = useCallback(() => {
    if (!retryableText || sending) return;
    void send(retryableText, { isRetry: true });
  }, [retryableText, sending, send]);

  // One-time AI data consent. Saved to the profile (mirrored to Supabase),
  // so the screen only appears before the very first message.
  // Await the consent write so the DB has ai_consent=true before the consent
  // screen dismisses and the user can send — otherwise the server-side consent
  // gate on /api/chat could 403 the first message on a write race.
  const acceptConsent = useCallback(async () => {
    setProfile(await acceptAiConsent());
  }, []);

  // Show the consent screen once the profile has loaded and consent is
  // still missing. `profile === null` means we're mid-hydrate — don't flash
  // the screen before we know whether they've already accepted.
  const needsConsent = profile !== null && !profile.aiConsent;

  const canSend = input.trim().length > 0 && !sending;

  // Has finished Myla's conversational onboarding — name + stage are the
  // authoritative signals (they map to Supabase columns, so they're
  // stable across devices). The `onboardingComplete` flag is local-only
  // and unreliable on a fresh browser, so don't use it as a gate.
  const onboardingDone = !!(profile?.name && profile?.stage);

  return (
    <main className="relative flex min-h-[100svh] min-h-[100dvh] flex-col bg-midnight">
      {needsConsent && <AiConsentScreen onAccept={acceptConsent} />}
      {/* Header */}
      <header className="safe-top sticky top-0 z-20 flex items-center justify-between border-b border-cream/5 bg-midnight/95 px-4 pb-3 backdrop-blur">
        <div className="flex items-center gap-3">
          {/* Always present so no one — including a continued-anon or a brand-
              new user mid-onboarding — is left without navigation. */}
          <button
            onClick={() => router.push("/app/home")}
            aria-label="home"
            className="rounded-full p-1 text-cream/70 active:scale-95"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12l-2 0l9 -9l9 9l-2 0M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6"
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
        <div className="flex items-center gap-1">
          {onboardingDone && (
            <Link
              href="/blog"
              aria-label="read the blog"
              className="rounded-full p-1.5 text-cream/45 transition hover:text-cream/80 active:scale-95"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M12 6.5C12 6.5 9.5 5 6.5 5C5.4 5 4.4 5.2 3.5 5.5V18.5C4.4 18.2 5.4 18 6.5 18C9.5 18 12 19.5 12 19.5M12 6.5C12 6.5 14.5 5 17.5 5C18.6 5 19.6 5.2 20.5 5.5V18.5C19.6 18.2 18.6 18 17.5 18C14.5 18 12 19.5 12 19.5M12 6.5V19.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          )}
          {onboardingDone ? (
            <Link
              href="/app/home"
              aria-label="home"
              className="text-gradient-peach font-display text-lg font-black rounded-md px-2 py-1 -mr-2 transition hover:opacity-80 active:scale-95"
            >
              2am
            </Link>
          ) : (
            <span
              aria-hidden
              className="text-gradient-peach font-display text-lg font-black rounded-md px-2 py-1 -mr-2"
            >
              2am
            </span>
          )}
        </div>
      </header>

      {/* Disclaimer */}
      <div
        style={{
          padding: "8px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          textAlign: "center",
          fontFamily: "var(--font-dm-mono), ui-monospace, monospace",
          fontSize: "11px",
          color: "rgba(255,255,255,0.2)",
        }}
      >
        myla is powered by ai — she&apos;s a well-read friend, not a doctor.
        always check with your provider for medical decisions.
      </div>

      {/* Messages */}
      <div className="messages-mask flex-1 overflow-y-auto px-4 pt-4 pb-32">
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
          {retryableText && !sending && (
            <div className="-mt-2 ml-10">
              <button
                type="button"
                onClick={retry}
                className="font-mono text-[10px] uppercase tracking-[0.22em] text-peach underline underline-offset-4 hover:text-coral"
              >
                tap to retry
              </button>
            </div>
          )}
          {/* Scroll anchor — tall spacer parked after every message, typing
              dots, and chips. scrollIntoView on this element parks the last
              real content well clear of the sticky input bar + safe area. */}
          <div ref={bottomRef} aria-hidden className="h-10 w-full shrink-0" />
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
        {onboardingDone && (
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

// Classify a free-text stage reply into ttc / pregnant / postpartum.
// Myla asks "are you trying to conceive, currently pregnant, or already a
// mom?" — users answer with the exact option, a paraphrase, or context
// ("my baby is 3 months old", "we've been trying for a year", "24 weeks").
// Order matters: the most specific signals are checked first so a pregnant
// user saying "i had a positive test" doesn't trip the postpartum branch.
export function detectStage(text: string): Stage {
  const t = text.toLowerCase().replace(/[’‘]/g, "'").trim();

  // Postpartum — explicit stage word, already-born-baby language, or
  // postpartum-only activities. "had" is only accepted in the "had my/the/a
  // baby" shape to avoid matching "had a positive test" / "had a scan".
  const postpartumPatterns: RegExp[] = [
    /\bpostpartum\b/,
    /\bpostnatal\b/,
    /\bnewborn\b/,
    /\bnew\s+mom\b/,
    /\balready\s+(?:a\s+)?mom\b/,
    /\bi'?m\s+a\s+mom\b/,
    /\bgave\s+birth\b/,
    /\bdelivered\b/,
    /\bhad\s+(?:my|the|a)\s+(?:baby|son|daughter|little|kid|boy|girl)\b/,
    /\bjust\s+had\s+(?:a\s+)?baby\b/,
    /\bweeks?\s+postpartum\b/,
    /\bmonths?\s+postpartum\b/,
    /\b(?:fourth|4th)\s+trimester\b/,
    /\bbreastfeeding\b/,
    /\bnursing\b/,
    /\bbaby\s+(?:is\s+)?\d+\s*(?:weeks?|wks?|months?|mos?|mo)\b/,
    /\b\d+\s*(?:weeks?|wks?|months?|mos?|mo)\s+old\b/,
  ];
  if (postpartumPatterns.some((r) => r.test(t))) return "postpartum";

  // TTC — explicit stage, fertility language, or bare "trying".
  const ttcPatterns: RegExp[] = [
    /\btrying\s+to\s+conceive\b/,
    /\bttc\b/,
    /\bconceiv/,
    /\btrying\b/,
    /\bfertility\b/,
    /\bovulat/,
    /\btracking\s+cycles?\b/,
  ];
  if (ttcPatterns.some((r) => r.test(t))) return "ttc";

  // Pregnant — explicit stage or pregnancy context. "week 20" / "24 weeks"
  // counts here; postpartum uses "weeks postpartum" which is matched above.
  const pregnantPatterns: RegExp[] = [
    /\bpregnant\b/,
    /\bpregnancy\b/,
    /\bexpecting\b/,
    /\b(?:first|second|third|1st|2nd|3rd)\s+trimester\b/,
    /\btrimester\b/,
    /\bdue\s+(?:date|in|on)\b/,
    /\bweek\s+\d+\b/,
    /\b\d+\s*(?:weeks?|wks?)\b/,
    /\bbun\s+in\s+the\s+oven\b/,
  ];
  if (pregnantPatterns.some((r) => r.test(t))) return "pregnant";

  // Fallback: Myla's question ends with "already a mom" — if the user just
  // echoes "mom" / "a mom" / "the third one" without a qualifier, treat as
  // postpartum rather than silently falling through to pregnant.
  if (/\b(?:a\s+)?mom\b/.test(t)) return "postpartum";
  if (/\b(?:3rd|third|last)\s+(?:one|option)\b/.test(t)) return "postpartum";

  // True last resort — something like "hi" or a typo. Default to pregnant
  // because that's the widest middle of the funnel; user can correct in
  // chat once onboarding completes.
  return "pregnant";
}

// Stage / timing / filler tokens that are never the user's name. Without
// this guard, the old fallback `words[words.length - 1]` returned things
// like "weeks", "pregnant", "months" when the user packed stage info into
// the same reply ("sarah, 16 weeks" → "weeks"; "5 weeks pregnant" →
// "pregnant"). Anything in here is rejected from both the pattern
// captures and the bare-word fallback.
const NON_NAME_TOKENS = new Set([
  "week", "weeks", "wk", "wks",
  "month", "months", "mo", "mos",
  "year", "years", "yr", "yrs",
  "day", "days",
  "pregnant", "pregnancy", "expecting", "trimester", "due",
  "trying", "ttc", "conceive", "conceiving", "fertility",
  "ovulating", "ovulation",
  "baby", "newborn", "postpartum", "postnatal",
  "mom", "mama", "mommy", "mother",
  "old", "ago", "since", "about", "around", "like", "over", "under", "for", "with",
  "boy", "girl", "twins", "son", "daughter", "kid",
  "named", "name",
  "yes", "no", "yeah", "nope", "yep", "nah",
  "okay", "ok", "hi", "hey", "hello", "sure", "maybe",
  "one", "two", "three", "four", "five", "six", "seven", "eight",
  "nine", "ten", "eleven", "twelve",
  "a", "an", "the", "and", "or", "but", "so", "just", "still",
  "im", "i", "me", "my", "we", "us", "our",
  "its", "it", "is", "are", "was", "were", "been", "be",
  "to", "at", "in", "on", "of", "by", "from",
]);

// Extract a first name from free-text replies like "ali", "my name is ali",
// "i'm ali", "call me ali", "ali!", etc. Handles straight + curly apostrophes,
// trailing punctuation, and emoji. When no pattern matches, returns the first
// remaining word that isn't a stage/timing token — so "sarah, 16 weeks"
// returns "sarah" and "5 weeks pregnant" returns "" (no plausible name).
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
    if (m && m[1] && !NON_NAME_TOKENS.has(m[1]) && m[1].length >= 2) {
      return m[1];
    }
  }

  // Walk left-to-right and pick the first token that looks like a name —
  // not a stop-listed word, not a single letter. "sarah, 16 weeks" → "sarah"
  // (digits already stripped by the char filter above). Strip apostrophes
  // before the stop-list lookup so contractions ("i'm", "it's") get caught.
  const words = norm.split(" ").filter(Boolean);
  for (const w of words) {
    const bare = w.replace(/'/g, "");
    if (NON_NAME_TOKENS.has(bare)) continue;
    if (bare.length < 2) continue;
    return bare;
  }
  return "";
}

// Does the text contain any signal that the user is talking about stage
// or timing? Used to gate detectStage at the name step — detectStage
// falls back to "pregnant" by design, so a bare "ali" would otherwise be
// tagged as pregnant. We only trust detectStage when there's actually
// something stage-y to detect.
export function hasStageSignal(text: string): boolean {
  const t = text.toLowerCase().replace(/[’‘]/g, "'");
  if (/\d/.test(t)) return true;
  return /\b(?:pregnant|pregnancy|expecting|trimester|due\s+(?:date|in|on)|trying|ttc|conceiv|fertility|ovulat|postpartum|postnatal|newborn|new\s+mom|already\s+a\s+mom|gave\s+birth|delivered|breastfeeding|nursing|fourth\s+trimester|baby|week|month|year)\b/.test(t);
}

// Extract the baby's sex from natural replies. Returns canonical values:
// "boy" | "girl" | "surprise" | "finding out" | "not sharing" | null.
// Order matters: surprise/finding-out/decline checks go first so we don't
// mis-classify "we're not finding out" as "not" + something.
export function parseBabySex(raw: string): string | null {
  if (!raw) return null;
  const t = raw.toLowerCase().replace(/[’‘]/g, "'").trim();

  // Surprise — user explicitly not finding out
  if (
    /\b(?:team\s+green|surprise|keeping\s+it\s+a\s+surprise|not\s+finding\s+out|don'?t\s+want\s+to\s+know|didn'?t\s+find\s+out|waiting\s+(?:til|till|until)\s+(?:birth|delivery|baby\s+comes?))\b/.test(t)
  ) {
    return "surprise";
  }

  // Finding out (intent, not yet known). Matches any phrasing that
  // contains "finding out" / "find out" / "gonna find out" etc.
  if (
    /\b(?:finding\s+out|gonna\s+find\s+out|going\s+to\s+find\s+out|planning\s+to\s+find\s+out|will\s+find\s+out|we'?ll\s+find\s+out|team\s+(?:blue\s+or\s+pink|yellow))\b/.test(t)
  ) {
    return "finding out";
  }

  // Not sharing with Myla
  if (/\bnot\s+sharing\b|prefer\s+not\s+to\s+say/.test(t)) {
    return "not sharing";
  }

  // Boy / girl — after the surprise/finding-out bailouts so "finding out
  // a boy" doesn't accidentally return boy; though that phrase is rare.
  if (/\b(?:it'?s\s+a\s+)?boy\b|\bhaving\s+a\s+boy\b|\bteam\s+blue\b|\bbaby\s+boy\b/.test(t)) {
    return "boy";
  }
  if (/\b(?:it'?s\s+a\s+)?girl\b|\bhaving\s+a\s+girl\b|\bteam\s+pink\b|\bbaby\s+girl\b/.test(t)) {
    return "girl";
  }

  return null;
}

// Extract a baby's name from free-text replies like "maya", "her name is
// maya", "we named him kai", "we're going with sloane", "owen!". Returns
// null when the user declines ("haven't picked yet", "not sure") or when
// the reply is ambiguous (multiple non-pattern words).
export function parseBabyName(raw: string): string | null {
  if (!raw) return null;
  const t = raw.toLowerCase().replace(/[’‘]/g, "'").trim();

  // Decline patterns — user isn't sharing a name.
  if (
    /\b(?:haven'?t\s+(?:picked|chosen|decided|named)|havent\s+(?:picked|chosen|decided|named)|no\s+name|not\s+yet|not\s+sure|not\s+decided|don'?t\s+know|dont\s+know|tbd|undecided|still\s+(?:deciding|choosing|picking|figuring)|not\s+sharing|keeping\s+(?:it\s+)?private)\b/.test(t)
  ) {
    return null;
  }

  const norm = t.replace(/[^a-z\s']/gu, " ").replace(/\s+/g, " ").trim();
  if (!norm) return null;

  const patterns: RegExp[] = [
    /\b(?:her|his|their|the\s+baby'?s|baby'?s)\s+name(?:\s+is|'s)\s+([a-z]+)/,
    /\bnamed\s+(?:her|him|them|the\s+baby)\s+([a-z]+)/,
    /\bnaming\s+(?:her|him|them|the\s+baby)\s+([a-z]+)/,
    /\bcall(?:ing|ed)?\s+(?:her|him|them)\s+([a-z]+)/,
    /\bgoing\s+with\s+([a-z]+)/,
    /\bname(?:\s+is|'s)\s+([a-z]+)/,
  ];
  for (const re of patterns) {
    const m = norm.match(re);
    if (m && m[1]) return m[1];
  }

  // Bare single-word reply is almost always just the name itself.
  // Two+ unmatched words could be anything ("baby is great"), so bail.
  const words = norm.split(" ").filter((w) => w.length > 0);
  if (
    words.length === 1 &&
    !/^(?:um|uh|oh|no|yes|and|or|the|a|an|hi|hey|hmm|ok|okay)$/.test(words[0])
  ) {
    return words[0];
  }

  return null;
}

export function parseWeek(text: string): number | null {
  // "20 weeks" / "20 wks" / "20w"
  let m = text.match(/\b(\d{1,2})\s*(?:weeks?|wks?|w)\b/i);
  // "week 20"
  if (!m) m = text.match(/\bweek\s+(\d{1,2})\b/i);
  // bare "20"
  if (!m) m = text.match(/^\s*(\d{1,2})\s*$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  if (n < 1 || n > 42) return null;
  return n;
}

const MONTH_NAMES = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

export function parseDueDate(text: string): string | null {
  // Direct parse first — ISO strings, "june 15 2026", etc.
  const direct = new Date(text);
  if (!Number.isNaN(direct.getTime()) && direct.getTime() > Date.now()) {
    return direct.toISOString().slice(0, 10);
  }

  // Extract month name + optional day from anywhere in text.
  // Handles: "due in july", "due date is july 18", "july 18th",
  // "due july 3rd", "september 2025".
  const monthRe =
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b(?:\s+(\d{1,2})(?:st|nd|rd|th)?)?(?:\s+(\d{4}))?/i;
  const m = text.match(monthRe);
  if (!m) return null;

  const monthShort = m[1].toLowerCase().slice(0, 3);
  const monthIdx = MONTH_NAMES.indexOf(monthShort);
  if (monthIdx < 0) return null;

  const day = m[2] ? parseInt(m[2], 10) : 15; // default to mid-month
  const now = new Date();
  let year = m[3] ? parseInt(m[3], 10) : now.getFullYear();
  let candidate = new Date(year, monthIdx, day);
  // If inferred date is already in the past (> 1 week), roll to next year.
  if (!m[3] && candidate.getTime() < now.getTime() - 7 * 24 * 60 * 60 * 1000) {
    year += 1;
    candidate = new Date(year, monthIdx, day);
  }
  if (Number.isNaN(candidate.getTime())) return null;
  return candidate.toISOString().slice(0, 10);
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
  let t = text.toLowerCase().replace(/[’‘]/g, "'").trim();

  // Strip child/baby-age phrases ("4 year old", "6 months old", "a year
  // old") before matching any duration — otherwise "i have a 4 year old
  // and we've been trying for a couple years" binds the 4 years to
  // "trying" and returns 48 months instead of 24.
  t = t.replace(
    /\b(?:\d+(?:\.\d+)?|a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|couple|few)\s+(?:years?|yrs?|months?|mos?|mo|weeks?|wks?)[-\s]+old\b/g,
    " ",
  );

  // Natural-language quantifiers: "a couple (of) years/months" = 2,
  // "a few years/months" = 3. Checked before the numeric patterns so
  // "couple"/"few" don't fall through to the bare-number branch.
  if (/\b(?:a\s+)?couple\s+(?:of\s+)?years?\b/.test(t)) return 24;
  if (/\b(?:a\s+)?couple\s+(?:of\s+)?months?\b/.test(t)) return 2;
  if (/\b(?:a\s+)?few\s+years?\b/.test(t)) return 36;
  if (/\b(?:a\s+)?few\s+months?\b/.test(t)) return 3;

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

// ---- continued-anon profile capture --------------------------------------
// detectStage() always returns a stage (defaults to "pregnant"), so only treat
// a message as carrying a stage when it has an explicit signal — otherwise a
// throwaway line like "hi" would silently set stage=pregnant.
const EXPLICIT_STAGE_RE =
  /\b(pregnant|pregnancy|expecting|trimester|postpartum|postnatal|newborn|new\s+mom|gave\s+birth|delivered|had\s+(?:my|the|a)\s+(?:baby|son|daughter|little|boy|girl)|breastfeed|nursing|trying\s+to\s+conceive|ttc|conceiv|fertility|ovulat|weeks?\s+(?:pregnant|along|postpartum)|due\s+(?:date|in|on)|baby\s+(?:is\s+)?\d|\d+\s*(?:weeks?|months?|mos?|mo)\s+old)\b/i;
const NAME_INTRO_RE =
  /\b(?:my\s+name'?s?|my\s+name\s+is|call\s+me|i'?m\s+called|i'?m|i\s+am|it'?s)\b/i;
const NAME_STRONG_RE = /\b(?:my\s+name|call\s+me|i'?m\s+called|name'?s)\b/i;
const NOT_A_NAME_RE =
  /\b(anxious|scared|nervous|worried|tired|exhausted|excited|fine|okay|ok|good|great|stressed|overwhelmed|sad|happy|here|new|pregnant|expecting|trying|postpartum|done|bleeding|cramping|spotting|feeling|hoping|hopeful|so|really|just|not|sure)\b/i;

// Extract a name only when we're fairly sure. Strong cues ("my name is X",
// "call me X") trust the parser; a weak "i'm X" requires X to look like a name
// (capitalized in the original) so we don't capture "i'm bleeding".
function extractName(text: string): string | null {
  if (!NAME_INTRO_RE.test(text)) return null;
  const candidate = parseName(text).trim();
  if (!/^[a-zA-Z][a-zA-Z'’-]{1,19}$/.test(candidate)) return null;
  if (NOT_A_NAME_RE.test(candidate)) return null;
  if (NAME_STRONG_RE.test(text)) return candidate;
  const cap = candidate.charAt(0).toUpperCase() + candidate.slice(1);
  return new RegExp(`\\b${cap}\\b`).test(text) ? candidate : null;
}

function captureFromText(
  text: string,
  current: LocalProfile | null,
): Partial<LocalProfile> {
  const out: Partial<LocalProfile> = {};
  if (EXPLICIT_STAGE_RE.test(text)) {
    const s = detectStage(text);
    out.stage = s;
    if (s === "pregnant") {
      const w = parseWeek(text);
      if (w !== null) out.week = w;
      else {
        const d = parseDueDate(text);
        if (d) out.dueDate = d;
      }
    }
  } else if (current?.stage === "pregnant") {
    // Already known pregnant — allow a bare "24 weeks" correction.
    const w = parseWeek(text);
    if (w !== null) out.week = w;
  }
  const n = extractName(text);
  if (n) out.name = n;
  return out;
}

// Scan a migrated transcript for the first confident name / stage / weeks,
// returning only fields the profile doesn't already have.
function captureFromTranscript(
  messages: Msg[],
  current: LocalProfile | null,
): Partial<LocalProfile> {
  const found: Partial<LocalProfile> = {};
  for (const m of messages) {
    if (m.role !== "user") continue;
    const cap = captureFromText(m.content, {
      ...(current ?? {}),
      ...found,
    } as LocalProfile);
    if (found.name === undefined && cap.name !== undefined) found.name = cap.name;
    if (found.stage === undefined && cap.stage !== undefined) found.stage = cap.stage;
    if (found.week === undefined && cap.week !== undefined) found.week = cap.week;
    if (found.dueDate === undefined && cap.dueDate !== undefined)
      found.dueDate = cap.dueDate;
    if (found.name !== undefined && found.stage !== undefined) break;
  }
  const patch: Partial<LocalProfile> = {};
  if (found.name && !current?.name) patch.name = found.name;
  if (found.stage && !current?.stage) patch.stage = found.stage;
  if (found.week !== undefined && (current?.week ?? null) === null)
    patch.week = found.week;
  if (found.dueDate && !current?.dueDate) patch.dueDate = found.dueDate;
  return patch;
}

// One-time directive that confirms what we already gathered, instead of asking
// cold. Used when a continued anon thread already revealed the user's stage.
function buildConfirmDirective(s: {
  name?: string | null;
  stage: Stage;
  week?: number | null;
}): string {
  const stageWord =
    s.stage === "pregnant"
      ? `pregnant${s.week ? `, around ${s.week} weeks` : ""}`
      : s.stage === "postpartum"
        ? "a new mom (postpartum)"
        : "trying to conceive";
  const example = `got you${s.name ? `, ${s.name}` : ""}${s.week ? ` at ${s.week} weeks` : ""} 💛 — that right?`;
  return `From the earlier conversation — before she made an account — you already know ${s.name ? `her name is ${s.name} and ` : ""}she's ${stageWord}. Warmly CONFIRM this in one short sentence as part of your reply (for example: "${example}"), then keep going naturally. Don't ask as if you don't know — just confirm. If she corrects anything, roll with it.`;
}
