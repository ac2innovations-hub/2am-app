import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import {
  MYLA_SYSTEM_PROMPT,
  buildUserContextLine,
  type UserProfileContext,
} from "@/lib/myla/system-prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IncomingMessage = {
  role: "user" | "assistant";
  content: string;
};

type Body = {
  messages: IncomingMessage[];
  userProfile?: UserProfileContext | null;
};

const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 800;

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey: key });
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

  const contextLine = buildUserContextLine(body.userProfile);

  const systemBlocks = [
    {
      type: "text" as const,
      text: MYLA_SYSTEM_PROMPT,
      cache_control: { type: "ephemeral" as const },
    },
    ...(contextLine ? [{ type: "text" as const, text: contextLine }] : []),
  ];

  try {
    const anthropic = getClient();
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemBlocks,
      messages: cleaned,
    });

    const text = response.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("");

    return NextResponse.json({
      message: text,
      usage: response.usage,
      stopReason: response.stop_reason,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error("/api/chat failed:", message);
    return NextResponse.json(
      { error: "myla had trouble responding. please try again." },
      { status: 500 },
    );
  }
}
