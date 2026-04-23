import type { Metadata } from "next";
import Link from "next/link";
import { AUDIENCE_LABEL, formatDate, getAllPosts } from "@/lib/blog/posts";
import "../legal.css";

export const metadata: Metadata = {
  title: "2am blog — answers for the questions you'd never google",
  description:
    "evidence-based answers to the questions women ask at 2 am. trying to conceive, pregnancy, and postpartum — no judgment, just information.",
  alternates: { canonical: "https://hey2am.app/blog" },
  openGraph: {
    title: "2am blog — answers for the questions you'd never google",
    description:
      "evidence-based answers to the questions women ask at 2 am. trying to conceive, pregnancy, and postpartum — no judgment, just information.",
    url: "https://hey2am.app/blog",
    siteName: "2am",
    type: "website",
    images: [{ url: "https://hey2am.app/og-image.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "2am blog",
    description:
      "evidence-based answers to the questions women ask at 2 am.",
    images: ["https://hey2am.app/og-image.png"],
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();
  return (
    <main className="legal-page">
      <div className="legal-container">
        <Link href="/" className="legal-back">
          ← back to home
        </Link>
        <Link href="/" className="legal-logo">
          2am
        </Link>

        <h1 className="legal-title">the 2am blog</h1>
        <p className="legal-meta">answers for the questions you&apos;d never google</p>

        <div className="blog-index-list">
          {posts.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="blog-index-card"
            >
              <div className="blog-index-card-meta">
                <span>{formatDate(p.date)}</span>
                <span>·</span>
                <span>{AUDIENCE_LABEL[p.audience]}</span>
              </div>
              <h2>{p.title}</h2>
              <p>{p.description}</p>
              <span className="blog-index-read">read →</span>
            </Link>
          ))}
        </div>

        <footer className="legal-footer">
          built with care in florida. 💛
          <div className="legal-footer-links">
            <Link href="/about">about</Link>
            <Link href="/blog">blog</Link>
            <Link href="/privacy">privacy</Link>
            <Link href="/terms">terms</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
