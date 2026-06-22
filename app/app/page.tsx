"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// /app is no longer an intermediate landing screen — it's a transparent
// router. Any direct hit on /app forwards: signed-in users to chat (entry-
// routing case #1 — onboarding runs in chat for new users; the dashboard
// stays reachable via the home icon), and logged-out visitors to the
// anonymous try-Myla flow (which has its own "log in" escape hatch).
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
        router.replace(user ? "/app/chat" : "/app/try");
      } catch {
        if (!cancelled) router.replace("/app/try");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Blank midnight canvas while we decide where to send them — no flash.
  return <main className="min-h-svh bg-midnight" />;
}
