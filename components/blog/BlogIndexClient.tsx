"use client";

import Link from "next/link";
import { useState } from "react";
import { STAGE_META, type Audience } from "@/lib/blog/posts";

export type IdxPost = {
  slug: string;
  title: string;
  description: string;
  audience: Audience;
  readMinutes: number;
};

const CHIPS: {
  key: "all" | "trying" | "pregnancy" | "postpartum";
  label: string;
  rgb: string;
  hex: string;
}[] = [
  { key: "all", label: "all", rgb: "248,200,168", hex: "#f8c8a8" },
  { key: "trying", label: "trying", rgb: "162,200,162", hex: "#a2c8a2" },
  { key: "pregnancy", label: "pregnancy", rgb: "248,200,168", hex: "#f8c8a8" },
  { key: "postpartum", label: "postpartum", rgb: "190,178,215", hex: "#beb2d7" },
];

// `all`-audience posts show under every filter; otherwise match the stage.
function visible(p: IdxPost, filter: string): boolean {
  if (filter === "all") return true;
  if (p.audience === "all") return true;
  return STAGE_META[p.audience].filter === filter;
}

function stageClass(a: Audience): string {
  const f = STAGE_META[a].filter;
  return f === "trying"
    ? "stage-sage"
    : f === "pregnancy"
      ? "stage-peach"
      : f === "postpartum"
        ? "stage-lavender"
        : "stage-none";
}

export default function BlogIndexClient({
  posts,
  featuredSlug,
}: {
  posts: IdxPost[];
  featuredSlug: string;
}) {
  const [filter, setFilter] = useState<string>("all");

  const featured = posts.find((p) => p.slug === featuredSlug) ?? null;
  const rest = posts.filter((p) => p.slug !== featuredSlug);
  const featuredVisible = featured ? visible(featured, filter) : false;
  const gridPosts = rest.filter((p) => visible(p, filter));

  return (
    <>
      <section className="blogidx-hero">
        <div className="blogidx-eyebrow landing-mono">the 2am blog</div>
        <h1 className="blogidx-h1">
          answers for the questions you&rsquo;d never google.
        </h1>
        <p className="blogidx-dek">
          written the way myla talks — honest, warm, and grounded in real
          clinical guidance. no rabbit holes.
        </p>
        <div className="blogidx-filters">
          {CHIPS.map((c) => {
            const active = filter === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setFilter(c.key)}
                className={`blogidx-chip chip-${c.key}`}
                style={
                  active
                    ? {
                        background: `rgba(${c.rgb},0.16)`,
                        borderColor: `rgba(${c.rgb},0.5)`,
                        color: c.hex,
                      }
                    : undefined
                }
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="blogidx-body">
        {featured && featuredVisible && (
          <Link href={`/blog/${featured.slug}`} className="blogidx-featured">
            <div className="blogidx-featured-meta">
              <span style={{ color: STAGE_META[featured.audience].hex ?? "#8b97ae" }}>
                {STAGE_META[featured.audience].tag}
              </span>
              <span className="dot" aria-hidden />
              <span className="muted">
                featured · {featured.readMinutes} min read
              </span>
            </div>
            <div className="blogidx-featured-title">{featured.title}</div>
            <p className="blogidx-featured-dek">{featured.description}</p>
            <div className="blogidx-featured-read">read →</div>
          </Link>
        )}

        <div className="blogidx-grid">
          {gridPosts.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className={`blogidx-card ${stageClass(p.audience)}`}
            >
              <div
                className="blogidx-card-meta"
                style={{ color: STAGE_META[p.audience].hex ?? "#8b97ae" }}
              >
                {STAGE_META[p.audience].tag} · {p.readMinutes} min
              </div>
              <div className="blogidx-card-title">{p.title}</div>
              <p className="blogidx-card-dek">{p.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
