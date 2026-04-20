"use client";

import { useState } from "react";

// POST-LAUNCH: When switching the landing back to "meet myla" mode,
// delete this component and its usage in app/page.tsx.
// Paste your real Formspree ID in place of MY_FORM_ID below, or set
// NEXT_PUBLIC_FORMSPREE_ID in Vercel env vars to override without a code change.
const FORM_ID = process.env.NEXT_PUBLIC_FORMSPREE_ID || "MY_FORM_ID";

type Status = "idle" | "sending" | "success" | "error";

type Props = {
  /** "hero" or "cta" — used as a hidden source field for Formspree. */
  source?: string;
};

export default function WaitlistForm({ source = "hero" }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || status === "sending") return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch(`https://formspree.io/f/${FORM_ID}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email: email.trim(), source }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setErrorMsg(body.error || "something went wrong. try again?");
        setStatus("error");
      }
    } catch {
      setErrorMsg("couldn't reach the waitlist. try again in a sec?");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="landing-waitlist-success" role="status" aria-live="polite">
        you&rsquo;re in! we&rsquo;ll let you know when myla is ready 💛
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="landing-waitlist" noValidate>
      <input
        type="email"
        name="email"
        required
        autoComplete="email"
        inputMode="email"
        spellCheck={false}
        placeholder="enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="landing-waitlist-input"
        disabled={status === "sending"}
        aria-label="email address"
      />
      <button
        type="submit"
        className="landing-waitlist-btn"
        disabled={status === "sending" || !email.trim()}
      >
        {status === "sending" ? "joining…" : "join the waitlist"}
      </button>
      {status === "error" && (
        <p className="landing-waitlist-error" role="alert">
          {errorMsg}
        </p>
      )}
    </form>
  );
}
