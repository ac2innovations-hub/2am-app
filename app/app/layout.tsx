import PushPrePrompt from "@/components/PushPrePrompt";

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
    </div>
  );
}
