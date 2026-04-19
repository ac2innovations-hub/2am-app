import { Suspense } from "react";
import HomeClient from "./HomeClient";

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-6 text-cream/60">loading…</div>}>
      <HomeClient />
    </Suspense>
  );
}
