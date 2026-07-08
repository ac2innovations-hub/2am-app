import MylaAvatar from "./MylaAvatar";

type Props = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatMessage({ role, content }: Props) {
  if (role === "assistant") {
    return (
      <div className="flex w-full animate-fade-up items-start gap-2">
        <div className="mt-1 shrink-0">
          <MylaAvatar size={28} />
        </div>
        <div
          className="max-w-[82%] border px-4 py-3 text-[14.5px] leading-[1.55] text-[#DCE3EF]"
          style={{
            backgroundColor: "rgba(255,255,255,0.055)",
            borderColor: "rgba(255,255,255,0.09)",
            borderRadius: "15px 15px 15px 4px",
          }}
        >
          {content.split("\n").map((line, i) => (
            <p key={i} className={i > 0 ? "mt-2" : ""}>
              {line}
            </p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full animate-fade-up justify-end">
      <div
        className="max-w-[82%] border px-4 py-3 text-[14.5px] leading-[1.5] text-[#F6E8DC]"
        style={{
          backgroundColor: "rgba(248,200,168,0.16)",
          borderColor: "rgba(248,200,168,0.28)",
          borderRadius: "15px 15px 4px 15px",
        }}
      >
        {content.split("\n").map((line, i) => (
          <p key={i} className={i > 0 ? "mt-2" : ""}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
