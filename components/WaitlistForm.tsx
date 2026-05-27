"use client";

import { useState } from "react";

// Primary "join the waitlist" variant is currently dormant (post-launch
// "meet myla" mode; see app/page.tsx). The secondary variant is rendered
// as a "not ready yet? drop your email" capture under the main CTA.

type Status = "idle" | "sending" | "success" | "error";

type Props = {
  /** Forwarded to the API so Formspree tags the source. */
  source?: string;
  /** "primary" is the full-width gradient form; "secondary" is the subdued under-CTA capture. */
  variant?: "primary" | "secondary";
  placeholder?: string;
  submitLabel?: string;
  submittingLabel?: string;
  successMessage?: React.ReactNode;
};

export default function WaitlistForm({
  source = "hero",
  variant = "primary",
  placeholder = "enter your email",
  submitLabel = "join the waitlist",
  submittingLabel = "joining…",
  successMessage,
}: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || status === "sending") return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/waitlist", {
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

  const formClass =
    variant === "secondary"
      ? "landing-waitlist landing-waitlist--secondary"
      : "landing-waitlist";

  if (status === "success") {
    return (
      <p className="landing-waitlist-success" role="status" aria-live="polite">
        {successMessage ?? (
          <>you&rsquo;re in! we&rsquo;ll let you know when myla is ready 💛</>
        )}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={formClass} noValidate>
      <input
        type="email"
        name="email"
        required
        autoComplete="email"
        inputMode="email"
        spellCheck={false}
        placeholder={placeholder}
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
        {status === "sending" ? submittingLabel : submitLabel}
      </button>
      {status === "error" && (
        <p className="landing-waitlist-error" role="alert">
          {errorMsg}
        </p>
      )}
    </form>
  );
}
