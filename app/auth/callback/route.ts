import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Supabase email-verification / magic-link / OAuth landing point.
// Exchanges the one-time `code` for a session cookie, then picks the
// right landing route based on whether the user has finished Myla's
// onboarding (name + stage populated on the profile row).
// Falls back to the auth page with an error flag if the exchange fails.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    console.error("[auth/callback] no code in url — redirecting to /app/auth");
    return redirectToAuthError(url, "missing_code");
  }

  const supabase = createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error(
      "[auth/callback] exchangeCodeForSession failed: %s (status=%s name=%s)",
      error.message,
      (error as { status?: number }).status ?? "n/a",
      error.name,
    );
    return redirectToAuthError(url, "exchange_failed");
  }

  const destination = await pickDestination(supabase);
  return NextResponse.redirect(new URL(destination, url.origin));
}

function redirectToAuthError(url: URL, reason: string) {
  const fallback = new URL("/app/auth", url.origin);
  fallback.searchParams.set("error", "verification_failed");
  fallback.searchParams.set("reason", reason);
  return NextResponse.redirect(fallback);
}

type SupabaseClient = ReturnType<typeof createClient>;

// Entry-routing case #1: everyone lands in /app/chat. Un-onboarded users run
// Myla's conversational onboarding there; already-onboarded users go straight
// to chat instead of the /app/home dashboard (still reachable via the chat
// home icon). The name/stage lookup is kept so onboarded vs un-onboarded can
// diverge again later (e.g. spec #4) without re-plumbing this.
async function pickDestination(supabase: SupabaseClient): Promise<string> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.warn("[auth/callback] getUser returned null after exchange");
      return "/app/chat";
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("name, stage")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error(
        "[auth/callback] profiles lookup failed: %s",
        error.message,
      );
      return "/app/chat";
    }
    if (!data) {
      return "/app/chat";
    }
    if (!data.name || !data.stage) {
      return "/app/chat";
    }
    return "/app/chat";
  } catch (err) {
    console.error(
      "[auth/callback] pickDestination threw: %s",
      err instanceof Error ? err.message : String(err),
    );
    return "/app/chat";
  }
}
