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

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
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

// Brand new users → /app/chat (Myla's conversational onboarding).
// Returning, already-onboarded users → /app/home.
// On any lookup failure, default to /app/chat so a new user is never
// trapped on an empty home hub.
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
