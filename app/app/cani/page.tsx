"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Category = {
  key: string;
  emoji: string;
  label: string;
  color: string;
  items: string[];
};

const CATEGORIES: Category[] = [
  {
    key: "food",
    emoji: "🍔",
    label: "food & drink",
    color: "coral",
    items: [
      "eat sushi",
      "drink coffee",
      "eat deli meat",
      "eat soft cheese",
      "eat spicy food",
      "eat honey",
      "have energy drinks",
      "eat pineapple",
    ],
  },
  {
    key: "meds",
    emoji: "💊",
    label: "medications",
    color: "lavender",
    items: [
      "take tylenol",
      "take ibuprofen",
      "take tums",
      "take benadryl",
      "take antibiotics",
      "use pepto-bismol",
    ],
  },
  {
    key: "activities",
    emoji: "🏋️",
    label: "activities",
    color: "sage",
    items: [
      "exercise",
      "have sex",
      "take a bath",
      "fly on a plane",
      "get a massage",
      "sleep on my back",
      "lift heavy things",
    ],
  },
  {
    key: "beauty",
    emoji: "💅",
    label: "beauty",
    color: "gold",
    items: [
      "dye my hair",
      "use retinol",
      "use self-tanner",
      "get my nails done",
      "whiten my teeth",
    ],
  },
];

function toQuery(item: string) {
  return `can i ${item}?`;
}

function pillHref(item: string) {
  return `/app/chat?new=1&q=${encodeURIComponent(toQuery(item))}`;
}

export default function CanIPage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    const all = CATEGORIES.flatMap((c) =>
      c.items.map((item) => ({ category: c, item })),
    );
    return all.filter(({ item }) => item.toLowerCase().includes(q));
  }, [search]);

  return (
    <main className="safe-top min-h-svh bg-midnight pb-12">
      <header className="flex items-center gap-3 px-5 pt-2 pb-4">
        <Link
          href="/app/home"
          aria-label="back"
          className="rounded-full p-1 text-cream/70 active:scale-95"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M12 4l-6 6 6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <h1 className="text-[22px] font-semibold text-cream">can i…?</h1>
      </header>

      <div className="px-5">
        <div className="flex items-center gap-2 rounded-full border border-cream/10 bg-navy px-4 py-2.5">
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden
          >
            <circle
              cx="9"
              cy="9"
              r="5.5"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-cream/40"
            />
            <path
              d="M13.5 13.5l3 3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="text-cream/40"
            />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search… eat sushi, take tylenol"
            className="flex-1 bg-transparent text-[14px] text-cream placeholder:text-cream/35 focus:outline-none"
            autoCapitalize="off"
            autoCorrect="off"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="clear"
              className="text-cream/40"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {filtered ? (
        <section className="mt-5 px-5">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-cream/45">
            {filtered.length} result{filtered.length === 1 ? "" : "s"}
          </div>
          <div className="divide-y divide-cream/5 rounded-2xl bg-navy/60">
            {filtered.length === 0 && (
              <div className="p-4 text-[14px] text-cream/55">
                nothing matched — ask myla directly below.
              </div>
            )}
            {filtered.map(({ category, item }) => (
              <Link
                key={`${category.key}-${item}`}
                href={pillHref(item)}
                className="flex items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{category.emoji}</span>
                  <span className="text-[15px] text-cream/90">
                    can i {item}?
                  </span>
                </div>
                <span className="text-cream/40">›</span>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <div className="mt-2 space-y-6 px-5">
          {CATEGORIES.map((cat) => (
            <section key={cat.key}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-base">{cat.emoji}</span>
                <h2 className="font-mono text-[10px] uppercase tracking-[0.28em] text-cream/55">
                  {cat.label}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {cat.items.map((item) => (
                  <Link
                    key={item}
                    href={pillHref(item)}
                    className="rounded-full border border-cream/10 bg-navy/70 px-4 py-2 text-[13px] text-cream/90 active:scale-[0.97]"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="mt-8 px-5">
        <Link
          href="/app/chat?new=1"
          className="flex w-full items-center justify-center gap-2 rounded-full border border-peach/40 bg-peach/10 px-5 py-3 text-sm text-peach"
        >
          don&apos;t see your question? ask myla anything →
        </Link>
      </div>
    </main>
  );
}
