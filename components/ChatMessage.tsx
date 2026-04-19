import MylaAvatar from "./MylaAvatar";

type Props = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatMessage({ role, content }: Props) {
  if (role === "assistant") {
    return (
      <div className="flex w-full animate-slide-up items-start gap-2">
        <div className="mt-5 shrink-0">
          <MylaAvatar size={28} />
        </div>
        <div className="max-w-[82%]">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.22em] text-peach/80">
            myla
          </div>
          <div className="rounded-2xl rounded-tl-md bg-navy/80 px-4 py-3 text-[15px] leading-relaxed text-cream/95">
            {content.split("\n").map((line, i) => (
              <p key={i} className={i > 0 ? "mt-2" : ""}>
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full animate-slide-up justify-end">
      <div className="max-w-[82%] rounded-2xl rounded-tr-md bg-peach-gradient px-4 py-3 text-[15px] leading-relaxed text-midnight">
        {content.split("\n").map((line, i) => (
          <p key={i} className={i > 0 ? "mt-2" : ""}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
