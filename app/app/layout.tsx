import PushPrePrompt from "@/components/PushPrePrompt";
import PushDebugOverlay from "@/components/PushDebugOverlay";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto min-h-svh w-full max-w-md bg-midnight">
      {children}
      {/* Native-only soft notification opt-in; self-gates on its own. */}
      <PushPrePrompt />
      {/* TEMPORARY: on-device push diagnostics, gated on ?pushdebug=1. */}
      <PushDebugOverlay />
    </div>
  );
}
