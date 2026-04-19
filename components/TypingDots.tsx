export default function TypingDots() {
  return (
    <div className="inline-flex items-center gap-1 rounded-2xl bg-navy/80 px-4 py-3 text-cream/70">
      <span
        className="block h-1.5 w-1.5 rounded-full bg-peach/80 animate-bounce-dot"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="block h-1.5 w-1.5 rounded-full bg-peach/80 animate-bounce-dot"
        style={{ animationDelay: "160ms" }}
      />
      <span
        className="block h-1.5 w-1.5 rounded-full bg-peach/80 animate-bounce-dot"
        style={{ animationDelay: "320ms" }}
      />
    </div>
  );
}
