import { Suspense } from "react";
import SettingsClient from "./SettingsClient";

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-cream/60">loading…</div>}>
      <SettingsClient />
    </Suspense>
  );
}
