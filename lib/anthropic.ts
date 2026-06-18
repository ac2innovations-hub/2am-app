import Anthropic from "@anthropic-ai/sdk";

// Model IDs are read from env vars so a model retirement is a one-line config
// change (Vercel env var + redeploy), not a code change. Each falls back to a
// known-good default if the env var is unset.
//
// PRIMARY_MODEL is what /api/chat uses normally. FALLBACK_MODEL is a different,
// broadly-available model the chat route degrades to if the primary call fails
// (e.g. the primary was retired and now returns a 404 not_found_error) — so a
// single model retirement degrades chat instead of killing it.
export const PRIMARY_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
export const FALLBACK_MODEL =
  process.env.ANTHROPIC_FALLBACK_MODEL ?? "claude-haiku-4-5-20251001";

export function getClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey: key });
}
