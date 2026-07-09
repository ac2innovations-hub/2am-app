"use client";

import { useEffect, useRef, useState } from "react";

// Interactive hero chat demo. Scripts are the four reconciled hero Q&As
// (verified against real Myla output, 2026-07-07). Plain bubble text only —
// no source badges (citation-voice principle). Brand tokens throughout.

type Msg = { role: "user" | "myla"; text: string };

const SCRIPTS: { q: string; replies: string[] }[] = [
  {
    q: "i'm 8 weeks and spotting brown. should i panic?",
    replies: [
      "take a breath — brown at 8 weeks is common, and brown specifically is a good sign: old blood, not fresh. still, mention it to your provider today — they may want a quick check or an ultrasound, so you're not sitting with the not-knowing.",
      "the signs that mean call right away: bright red or heavy bleeding, cramping that builds, or passing tissue — then your ob, or l&d. any cramping with it right now?",
    ],
  },
  {
    q: "is heartburn normal at 14 weeks?",
    replies: [
      "very normal — and earlier than most people expect. progesterone relaxes the valve at the top of your stomach, and at 14 weeks things are getting more crowded in there.",
      "what actually helps: smaller meals, don't lie down right after eating, prop your head up at night. if it's rough, ask your ob about tums — safe in pregnancy, with a little calcium bonus. 💛",
    ],
  },
  {
    q: "we've been trying for 8 months. is something wrong?",
    replies: [
      "eight months is genuinely exhausting — the hoping and the waiting, over and over. and you're still in the normal window: about 85% of couples conceive within a year, and most of the rest just needed a little help. 'something wrong' usually means 'something findable — and often treatable.'",
      "the honest variable is age: under 35, most docs say give it a year before testing; 35+, six months. are you tracking ovulation at all, or has anything felt off? 💛",
    ],
  },
  {
    q: "do i have ppd or am i just tired?",
    replies: [
      "the fact that you're even asking matters. tired is universal after a baby — but ppd is different: heavier, and it lingers past those first couple weeks instead of lifting. and it doesn't always look like crying — sometimes it's numbness, rage, or feeling disconnected.",
      "on the nights you get a real stretch of sleep, does the heaviness lift at all? either way, this is one worth saying out loud to your ob — i can help you find the words. 💛",
    ],
  },
];

// CSS myla mark — radial-gradient disc with a lowercase peach "m" (not an image).
function Mark({ size }: { size: number }) {
  return (
    <div
      aria-hidden
      style={{
        flex: "none",
        width: size,
        height: size,
        borderRadius: "50%",
        background: "radial-gradient(circle at 35% 30%, #24334F, #101B33)",
        border: "1px solid rgba(248,200,168,0.35)",
        color: "var(--peach)",
        fontWeight: 700,
        fontSize: Math.round(size * 0.42),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      m
    </div>
  );
}

export default function MylaDemo() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [played, setPlayed] = useState<number[]>([]);
  const busy = useRef(false);
  const scroller = useRef<HTMLDivElement | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      timers.current.push(setTimeout(resolve, ms));
    });

  async function play(i: number) {
    if (busy.current) return;
    busy.current = true;
    setPlayed((prev) => (prev.includes(i) ? prev : [...prev, i]));
    setMessages((prev) => [...prev, { role: "user", text: SCRIPTS[i].q }]);
    for (const reply of SCRIPTS[i].replies) {
      await wait(450);
      setTyping(true);
      await wait(1000);
      setTyping(false);
      setMessages((prev) => [...prev, { role: "myla", text: reply }]);
    }
    busy.current = false;
  }

  function reset() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    busy.current = false;
    setTyping(false);
    setMessages([]);
    setPlayed([]);
  }

  // Auto-play the first Q&A ~1.7s after load.
  useEffect(() => {
    const t = setTimeout(() => void play(0), 1700);
    const pending = timers.current;
    return () => {
      clearTimeout(t);
      pending.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to the newest message.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  const showIntro = messages.length === 0;

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 430, margin: "0 auto" }}>
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: -40,
          background:
            "radial-gradient(circle at 50% 32%, rgba(248,200,168,0.15), transparent 65%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          background: "var(--navy)",
          border: "1px solid rgba(255,255,255,0.11)",
          borderRadius: 22,
          boxShadow: "0 30px 80px rgba(3,7,18,0.55)",
          overflow: "hidden",
        }}
      >
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px" }}>
          <Mark size={30} />
          <div>
            <div style={{ color: "var(--cream)", fontWeight: 600, fontSize: 14, lineHeight: 1.2 }}>
              myla
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#8FCFA6" }} />
              <span
                style={{
                  fontFamily: "var(--font-dm-mono), monospace",
                  fontSize: 9.5,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#8FCFA6",
                }}
              >
                always here
              </span>
            </div>
          </div>
          {!showIntro && (
            <button
              type="button"
              onClick={reset}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-dm-mono), monospace",
                fontSize: 10,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#8B97AE",
                padding: 4,
              }}
            >
              ↺ start over
            </button>
          )}
        </div>

        {/* disclaimer */}
        <div
          style={{
            padding: "8px 18px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            fontFamily: "var(--font-dm-mono), monospace",
            fontSize: 10,
            letterSpacing: "0.06em",
            color: "#8B97AE",
          }}
        >
          powered by ai — a well-read friend, not a doctor.
        </div>

        {/* messages */}
        <div
          ref={scroller}
          style={{
            height: 330,
            overflowY: "auto",
            padding: "18px 18px 10px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {showIntro && (
            <div
              style={{
                margin: "auto",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                padding: "16px 0",
              }}
            >
              <Mark size={46} />
              <div style={{ fontWeight: 600, fontSize: 15, color: "var(--cream)" }}>
                hey — what&rsquo;s up?
              </div>
              <div style={{ fontSize: 13, color: "#7E8AA0" }}>
                ask me anything. no judgment.
              </div>
              <div
                style={{
                  fontFamily: "var(--font-dm-mono), monospace",
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--peach)",
                  marginTop: 6,
                }}
              >
                ↓ tap a question to see her answer
              </div>
            </div>
          )}

          {messages.map((m, i) =>
            m.role === "user" ? (
              <div
                key={i}
                style={{
                  alignSelf: "flex-end",
                  maxWidth: "78%",
                  background: "rgba(248,200,168,0.16)",
                  border: "1px solid rgba(248,200,168,0.28)",
                  color: "#F6E8DC",
                  padding: "10px 14px",
                  borderRadius: "15px 15px 4px 15px",
                  fontSize: 14.5,
                  lineHeight: 1.5,
                  animation: "fadeup 0.25s ease",
                }}
              >
                {m.text}
              </div>
            ) : (
              <div
                key={i}
                style={{
                  alignSelf: "flex-start",
                  display: "flex",
                  gap: 8,
                  maxWidth: "90%",
                  animation: "fadeup 0.25s ease",
                }}
              >
                <div style={{ marginTop: 2 }}>
                  <Mark size={24} />
                </div>
                <div
                  style={{
                    background: "rgba(255,255,255,0.055)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    color: "#DCE3EF",
                    padding: "10px 14px",
                    borderRadius: "15px 15px 15px 4px",
                    fontSize: 14.5,
                    lineHeight: 1.55,
                  }}
                >
                  {m.text}
                </div>
              </div>
            ),
          )}

          {typing && (
            <div
              style={{
                alignSelf: "flex-start",
                display: "flex",
                gap: 8,
                animation: "fadeup 0.2s ease",
              }}
            >
              <div style={{ marginTop: 2 }}>
                <Mark size={24} />
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.055)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  padding: "13px 15px",
                  borderRadius: "15px 15px 15px 4px",
                  display: "flex",
                  gap: 5,
                  alignItems: "center",
                }}
              >
                {[0, 0.15, 0.3].map((d) => (
                  <span
                    key={d}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#8B97AE",
                      animation: `typebounce 1.1s ease-in-out ${d}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* suggestion chips */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            padding: "12px 18px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {SCRIPTS.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => void play(i)}
              style={{
                opacity: played.includes(i) ? 0.4 : 1,
                cursor: "pointer",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.14)",
                color: "#C6CFDD",
                fontSize: 12.5,
                padding: "8px 13px",
                borderRadius: 999,
                transition: "border-color 0.2s ease, color 0.2s ease",
              }}
            >
              {s.q}
            </button>
          ))}
        </div>

        {/* faux input (visual only) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 14px 14px 18px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div style={{ flex: 1, color: "#5F6C85", fontSize: 14 }}>message myla…</div>
          <div
            aria-hidden
            style={{
              flex: "none",
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #f8c8a8, #ee9b78)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--midnight)",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            ↑
          </div>
        </div>
      </div>
    </div>
  );
}
