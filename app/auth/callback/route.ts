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
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  console.log(
    "[auth/callback] hit — code=%s token_hash=%s type=%s",
    code ? "present" : "missing",
    tokenHash ? "present" : "missing",
    type ?? "n/a",
  );

  if (!code) {
    console.error("[auth/callback] no code in url — redirecting to /app/auth");
    return redirectToAuthError(url, "missing_code");
  }

  const supabase = createClient();

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error(
      "[auth/callback] exchangeCodeForSession failed: %s (status=%s name=%s)",
      error.message,
      (error as { status?: number }).status ?? "n/a",
      error.name,
    );
    return redirectToAuthError(url, "exchange_failed");
  }

  console.log(
    "[auth/callback] exchange ok — session for user=%s",
    data?.user?.id ?? "unknown",
  );

  const destination = await pickDestination(supabase);
  console.log("[auth/callback] redirecting to %s", destination);
  return NextResponse.redirect(new URL(destination, url.origin));
}

function redirectToAuthError(url: URL, reason: string) {
  const fallback = new URL("/app/auth", url.origin);
  fallback.searchParams.set("error", "verification_failed");
  fallback.searchParams.set("reason", reason);
  return NextResponse.redirect(fallback);
}

type SupabaseClient = ReturnType<typeof createClient>;

// Brand new users → /app/chat (Myla's conversational onboarding).
// Returning, already-onboarded users → /app/home.
// On any lookup failure, default to /app/chat so a new user is never
// trapped on an empty home hub.
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
      console.log(
        "[auth/callback] no profile row yet (trigger may not have fired) — onboarding",
      );
      return "/app/chat";
    }
    if (!data.name || !data.stage) {
      console.log(
        "[auth/callback] profile has empty name/stage — onboarding (name=%s stage=%s)",
        data.name ?? "null",
        data.stage ?? "null",
      );
      return "/app/chat";
    }
    return "/app/home";
  } catch (err) {
    console.error(
      "[auth/callback] pickDestination threw: %s",
      err instanceof Error ? err.message : String(err),
    );
    return "/app/chat";
  }
}
