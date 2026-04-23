import Anthropic, {
  APIConnectionError,
  APIError,
  APIUserAbortError,
} from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import {
  MYLA_SYSTEM_PROMPT,
  ONBOARDING_SYSTEM_ADDITION,
  buildUserContextLine,
  type UserProfileContext,
} from "@/lib/myla/system-prompt";
import { checkRateLimit } from "@/lib/rate-limiter";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IncomingMessage = {
  role: "user" | "assistant";
  content: string;
};

type Body = {
  messages: IncomingMessage[];
  userProfile?: UserProfileContext | null;
  onboardingDirective?: string | null;
};

const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 800;
const ANTHROPIC_TIMEOUT_MS = 30_000;
const RETRY_DELAY_MS = 2_000;
const DAILY_MESSAGE_LIMIT = 50;

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey: key });
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

async function getRateLimitKey(req: NextRequest): Promise<string> {
  try {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) return `user:${user.id}`;
  } catch {
    // fall through to IP
  }
  return `ip:${getClientIp(req)}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type FriendlyError = {
  status: number;
  body: { error: string; message: string };
};

const ERRORS = {
  upstreamRateLimited: {
    status: 503,
    body: {
      error: "upstream_rate_limited",
      message: "myla needs a quick breather — try again in a moment 💛",
    },
  } as FriendlyError,
  upstreamOverloaded: {
    status: 503,
    body: {
      error: "upstream_overloaded",
      message: "myla needs a quick breather — try again in a moment 💛",
    },
  } as FriendlyError,
  network: {
    status: 503,
    body: {
      error: "network_error",
      message: "looks like something went wrong on our end — try again? 💛",
    },
  } as FriendlyError,
  emptyResponse: {
    status: 503,
    body: {
      error: "empty_response",
      message: "hmm, myla got a little lost. try rephrasing? 💛",
    },
  } as FriendlyError,
  generic: {
    status: 503,
    body: {
      error: "api_error",
      message:
        "myla's being a little slow right now — try sending that again in a sec 💛",
    },
  } as FriendlyError,
};

function mapAnthropicError(err: unknown): FriendlyError {
  if (err instanceof APIError) {
    const status = err.status ?? 0;
    if (status === 429) return ERRORS.upstreamRateLimited;
    if (status === 529) return ERRORS.upstreamOverloaded;
    if (status >= 500) return ERRORS.generic;
  }
  if (err instanceof APIConnectionError) return ERRORS.network;
  if (err instanceof APIUserAbortError) return ERRORS.generic;
  if (err instanceof Error && err.name === "AbortError") return ERRORS.generic;
  return ERRORS.generic;
}

function isRetryable(err: unknown): boolean {
  if (err instanceof APIError) {
    const status = err.status ?? 0;
    return status >= 500 && status !== 529;
  }
  if (err instanceof APIConnectionError) return true;
  if (err instanceof APIUserAbortError) return true;
  if (err instanceof Error && err.name === "AbortError") return true;
  return false;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json(
      { error: "messages is required" },
      { status: 400 },
    );
  }

  const cleaned = body.messages
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .map((m) => ({ role: m.role, content: m.content }));

  if (cleaned.length === 0) {
    return NextResponse.json(
      { error: "messages must contain at least one non-empty turn" },
      { status: 400 },
    );
  }

  // Rate limit — key on auth user if present, else IP.
  const rateLimitKey = await getRateLimitKey(req);
  const rl = checkRateLimit(rateLimitKey, DAILY_MESSAGE_LIMIT);
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: "limit_reached",
        message:
          "you've hit your daily message limit. myla will be back tomorrow! 💛",
      },
      { status: 429 },
    );
  }

  const contextLine = buildUserContextLine(body.userProfile);
  const directive =
    typeof body.onboardingDirective === "string"
      ? body.onboardingDirective.trim()
      : "";

  const systemBlocks = [
    {
      type: "text" as const,
      text: MYLA_SYSTEM_PROMPT,
      cache_control: { type: "ephemeral" as const },
    },
    ...(contextLine ? [{ type: "text" as const, text: contextLine }] : []),
    ...(directive
      ? [
          { type: "text" as const, text: ONBOARDING_SYSTEM_ADDITION },
          {
            type: "text" as const,
            text: `[ONBOARDING DIRECTIVE: ${directive}]`,
          },
        ]
      : []),
  ];

  async function callOnce() {
    const anthropic = getClient();
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      ANTHROPIC_TIMEOUT_MS,
    );
    try {
      return await anthropic.messages.create(
        {
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: systemBlocks,
          messages: cleaned,
        },
        { signal: controller.signal },
      );
    } finally {
      clearTimeout(timer);
    }
  }

  let response;
  try {
    try {
      response = await callOnce();
    } catch (err) {
      if (!isRetryable(err)) throw err;
      console.warn(
        "/api/chat first attempt failed, retrying in %dms: %s",
        RETRY_DELAY_MS,
        err instanceof Error ? err.message : String(err),
      );
      await sleep(RETRY_DELAY_MS);
      response = await callOnce();
    }
  } catch (err) {
    const friendly = mapAnthropicError(err);
    console.error(
      "/api/chat failed after retry: %s",
      err instanceof Error ? err.message : String(err),
    );
    return NextResponse.json(friendly.body, { status: friendly.status });
  }

  const text = response.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("");

  if (!text.trim()) {
    return NextResponse.json(ERRORS.emptyResponse.body, {
      status: ERRORS.emptyResponse.status,
    });
  }

  return NextResponse.json({
    message: text,
    usage: response.usage,
    stopReason: response.stop_reason,
  });
}
