"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// /app is no longer an intermediate landing screen — it's a transparent
// router. The marketing landing page's "meet myla" CTA points straight at
// /app/auth, and any direct hit on /app just forwards: signed-in users to
// their home, everyone else to the auth/signup flow.
export default function AppEntry() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled) return;
        router.replace(user ? "/app/home" : "/app/auth");
      } catch {
        if (!cancelled) router.replace("/app/auth");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Blank midnight canvas while we decide where to send them — no flash.
  return <main className="min-h-svh bg-midnight" />;
}
