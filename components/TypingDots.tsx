export default function TypingDots() {
  return (
    <div
      className="inline-flex items-center gap-1 border px-4 py-3"
      style={{
        backgroundColor: "rgba(255,255,255,0.055)",
        borderColor: "rgba(255,255,255,0.09)",
        borderRadius: "15px 15px 15px 4px",
      }}
    >
      <span
        className="block h-1.5 w-1.5 rounded-full bg-peach/80 animate-type-bounce"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="block h-1.5 w-1.5 rounded-full bg-peach/80 animate-type-bounce"
        style={{ animationDelay: "150ms" }}
      />
      <span
        className="block h-1.5 w-1.5 rounded-full bg-peach/80 animate-type-bounce"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );
}
