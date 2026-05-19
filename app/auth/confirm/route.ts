import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Handles Supabase's legacy token_hash email confirmation links
// (the default template format: ?token_hash=...&type=signup).
// Verifies the OTP, which writes the session cookie, then picks the
// right landing route based on onboarding status.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  if (!token_hash || !type) {
    console.error("[auth/confirm] missing token_hash or type");
    return redirectToAuthError(url, "missing_token");
  }

  const supabase = createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });
  if (error) {
    console.error(
      "[auth/confirm] verifyOtp failed: %s (status=%s name=%s)",
      error.message,
      (error as { status?: number }).status ?? "n/a",
      error.name,
    );
    return redirectToAuthError(url, "verify_failed");
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

async function pickDestination(supabase: SupabaseClient): Promise<string> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.warn("[auth/confirm] getUser returned null after verify");
      return "/app/chat";
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("name, stage")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error(
        "[auth/confirm] profiles lookup failed: %s",
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
    return "/app/home";
  } catch (err) {
    console.error(
      "[auth/confirm] pickDestination threw: %s",
      err instanceof Error ? err.message : String(err),
    );
    return "/app/chat";
  }
}
