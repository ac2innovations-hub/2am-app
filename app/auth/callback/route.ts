import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Supabase email-verification / magic-link / OAuth landing point.
// Exchanges the one-time `code` for a session cookie, then forwards
// the user to `?next=` (defaults to /app/home). Falls back to the
// auth page with an error flag if the exchange fails.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/app/home";

  // Only allow same-origin redirects so an attacker can't use ?next=
  // to bounce verified users to an external site.
  const safeNext = next.startsWith("/") ? next : "/app/home";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(safeNext, url.origin));
    }
  }

  const fallback = new URL("/app/auth", url.origin);
  fallback.searchParams.set("error", "verification_failed");
  return NextResponse.redirect(fallback);
}
