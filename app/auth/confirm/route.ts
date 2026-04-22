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

  if (token_hash && type) {
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      const destination = await pickDestination(supabase);
      return NextResponse.redirect(new URL(destination, url.origin));
    }
  }

  const fallback = new URL("/app/auth", url.origin);
  fallback.searchParams.set("error", "verification_failed");
  return NextResponse.redirect(fallback);
}

type SupabaseClient = ReturnType<typeof createClient>;

async function pickDestination(supabase: SupabaseClient): Promise<string> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return "/app/chat";

    const { data, error } = await supabase
      .from("profiles")
      .select("name, stage")
      .eq("id", user.id)
      .maybeSingle();

    if (error) return "/app/chat";
    if (!data) return "/app/chat";
    if (!data.name || !data.stage) return "/app/chat";
    return "/app/home";
  } catch {
    return "/app/chat";
  }
}
