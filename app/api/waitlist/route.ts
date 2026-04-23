import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WELCOME_SUBJECT = "you're in 💛";

const WELCOME_HTML = `<div style="font-family: sans-serif; font-size: 15px; line-height: 1.7; color: #333; max-width: 560px; margin: 0 auto;">
<p>hey!</p>
<p>you just joined the 2am waitlist — and honestly, we're so glad you're here.</p>
<p>we're building something for you. for the questions you'd never google. for the 2 am moments when everyone else is asleep and you just need someone to tell you it's going to be okay.</p>
<p>myla is an ai-powered friend — not a doctor, not a search engine, not a mom group with opinions. just a warm, evidence-based, judgment-free friend for wherever you are in your journey. trying. expecting. navigating life as a new mom.</p>
<p>she's almost ready. we'll be in touch soon.</p>
<p>— the 2am team<br><a href="https://hey2am.app" style="color: #EE9B78;">hey2am.app</a></p>
</div>`;

type Body = { email?: string; source?: string };

function isValidEmail(s: string) {
  // Intentionally loose — Formspree and Resend will validate properly,
  // we just want to reject obvious junk before hitting either.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

async function forwardToFormspree(payload: { email: string; source: string }) {
  const id = process.env.FORMSPREE_ID ?? process.env.NEXT_PUBLIC_FORMSPREE_ID;
  if (!id || id === "MY_FORM_ID") {
    console.warn(
      "[waitlist] Formspree ID not configured — skipping forward",
    );
    return { ok: false, skipped: true as const };
  }
  try {
    const res = await fetch(`https://formspree.io/f/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      return { ok: false, skipped: false as const, error: body.error };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      skipped: false as const,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const email = (body.email ?? "").trim();
  const source = (body.source ?? "hero").trim();

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: "please enter a valid email." },
      { status: 400 },
    );
  }

  // Formspree is the source of truth for the waitlist list — always try.
  // We run it in parallel with the welcome send; either can fail without
  // the other being affected.
  const [formspreeResult, emailResult] = await Promise.all([
    forwardToFormspree({ email, source }),
    sendEmail({
      to: email,
      subject: WELCOME_SUBJECT,
      html: WELCOME_HTML,
    }),
  ]);

  if (!formspreeResult.ok && !formspreeResult.skipped) {
    return NextResponse.json(
      { error: formspreeResult.error ?? "couldn't save your spot. try again?" },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    emailSent: emailResult.sent,
  });
}
