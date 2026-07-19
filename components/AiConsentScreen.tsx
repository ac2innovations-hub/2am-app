"use client";

import Link from "next/link";
import MylaAvatar from "@/components/MylaAvatar";

// One-time AI data consent. Shown over the chat after login but before the
// user can send their first message to Myla. Accepting sets profile.ai_consent
// so it never shows again. Styled in the 2am brand (midnight + peach).
export default function AiConsentScreen({
  onAccept,
  loginHref,
}: {
  onAccept: () => void;
  // When set (the anonymous try-Myla flow), show a persistent escape hatch to
  // the login page so a returning user is never forced through the try flow.
  loginHref?: string;
}) {
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
          one quick thing before you start
        </h1>

        <p className="mb-4 text-[15px] leading-relaxed text-cream/80">
          myla is powered by anthropic&rsquo;s ai. to answer you, your messages
          are sent to anthropic&rsquo;s api — and anthropic doesn&rsquo;t use
          them to train their models.
        </p>

        <p className="mb-5 text-[15px] leading-relaxed text-cream/80">
          your chats are also stored securely so you can come back to them, and
          handled only by the providers that run 2am (listed in our privacy
          policy). we never sell your data or use it for ads. you can delete it
          anytime.
        </p>

        <p className="mb-7 text-[14px] leading-relaxed text-cream/70">
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-peach underline underline-offset-2 hover:text-coral"
          >
            read our full privacy policy
          </Link>
        </p>

        <button
          type="button"
          onClick={onAccept}
          className="flex items-center justify-center rounded-full bg-peach-gradient px-6 py-4 text-[15px] font-semibold text-midnight shadow-glow transition active:scale-[0.98]"
        >
          got it, let&rsquo;s chat
        </button>

        {loginHref && (
          <p className="mt-5 text-center text-[13px] text-cream/60">
            already have an account?{" "}
            <Link
              href={loginHref}
              className="text-peach underline underline-offset-2 hover:text-coral"
            >
              log in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
