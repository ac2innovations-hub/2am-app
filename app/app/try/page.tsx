import { Suspense } from "react";
import TryMylaClient from "./TryMylaClient";

// Public route — the anonymous "try Myla before signup" flow. Not in the
// middleware's protected prefixes, so logged-out visitors can reach it; the
// client redirects logged-in users to /app/chat.
export default function TryPage() {
  return (
    <Suspense fallback={<div className="p-6 text-cream/60">loading…</div>}>
      <TryMylaClient />
    </Suspense>
  );
}
