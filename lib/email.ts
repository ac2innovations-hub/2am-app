import { Resend } from "resend";

// Centralized transactional email sender. Returns { sent: false } when
// RESEND_API_KEY isn't configured so call sites can decide whether to
// continue the surrounding flow (e.g. waitlist signup still writes to
// Formspree even if email delivery is unavailable).

export const DEFAULT_FROM = "2am <myla@hey2am.app>";
export const DEFAULT_REPLY_TO = "ali@hey2am.app";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  text?: string;
};

export type SendEmailResult =
  | { sent: true; id: string | null }
  | { sent: false; reason: "no_api_key" | "error"; error?: string };

export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — skipping send");
    return { sent: false, reason: "no_api_key" };
  }

  const client = new Resend(apiKey);
  try {
    const { data, error } = await client.emails.send({
      from: input.from ?? DEFAULT_FROM,
      replyTo: input.replyTo ?? DEFAULT_REPLY_TO,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    if (error) {
      console.error("[email] resend error:", error.message);
      return { sent: false, reason: "error", error: error.message };
    }
    return { sent: true, id: data?.id ?? null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[email] send threw:", msg);
    return { sent: false, reason: "error", error: msg };
  }
}
