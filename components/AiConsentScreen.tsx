"use client";

import Link from "next/link";
import MylaAvatar from "@/components/MylaAvatar";

// One-time AI data consent. Shown over the chat after login but before the
// user can send their first message to Myla. Accepting sets profile.ai_consent
// so it never shows again. Styled in the 2am brand (midnight + peach).
export default function AiConsentScreen({
  onAccept,
}: {
  onAccept: () => void;
}) {
  const DONTS = [
    "we don't sell your data",
    "we don't show you ads",
    "we don't share your data with insurers or advertisers",
    "Anthropic does not use your conversations to train their AI models",
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-consent-heading"
      className="fixed inset-0 z-50 overflow-y-auto bg-midnight"
    >
      <div className="safe-top safe-bottom mx-auto flex min-h-[100svh] w-full max-w-md flex-col justify-center px-6 py-10">
        <div className="mb-6 flex items-center gap-3">
          <MylaAvatar size={40} />
          <span className="font-display text-2xl font-black text-gradient-peach">
            2am
          </span>
        </div>

        <h1
          id="ai-consent-heading"
          className="mb-5 font-display text-[26px] font-bold leading-snug text-cream"
        >
          before you start chatting with myla, here&rsquo;s how it works
        </h1>

        <p className="mb-5 text-[15px] leading-relaxed text-cream/80">
          your messages are processed by Anthropic&rsquo;s Claude AI to generate
          myla&rsquo;s responses. this means what you share in your conversations
          — including your name, stage, and anything you tell myla — is sent to
          Anthropic.
        </p>

        <div className="mb-5 rounded-2xl border border-peach/20 bg-navy/60 p-5">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-peach">
            what we don&rsquo;t do
          </p>
          <ul className="flex flex-col gap-2.5">
            {DONTS.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-[14px] leading-snug text-cream/85"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="mt-0.5 shrink-0 text-sage"
                  aria-hidden
                >
                  <path
                    d="M4 10.5l4 4 8-9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mb-7 text-[14px] leading-relaxed text-cream/70">
          by continuing, you agree to share your conversation data with
          Anthropic&rsquo;s AI service to power myla&rsquo;s responses. read our{" "}
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-peach underline underline-offset-2 hover:text-coral"
          >
            privacy policy
          </Link>
          .
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onAccept}
            className="flex items-center justify-center rounded-full bg-peach-gradient px-6 py-4 text-[15px] font-semibold text-midnight shadow-glow transition active:scale-[0.98]"
          >
            i understand, let&rsquo;s chat
          </button>
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center rounded-full border border-cream/15 px-6 py-3.5 text-[14px] font-medium text-cream/80 transition hover:border-cream/30 hover:text-cream active:scale-[0.98]"
          >
            read privacy policy
          </Link>
        </div>
      </div>
    </div>
  );
}
