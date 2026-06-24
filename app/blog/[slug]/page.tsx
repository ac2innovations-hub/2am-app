import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AUDIENCE_LABEL, AUTHOR, POSTS, getPost } from "@/lib/blog/posts";
import "../../legal.css";

type Props = { params: { slug: string } };

const SITE = "https://www.hey2am.app";
const OG_IMAGE = `${SITE}/og-image.png`;

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const post = getPost(params.slug);
  if (!post) return { title: "post not found — 2am blog" };

  const url = `${SITE}/blog/${post.slug}`;
  return {
    title: `${post.title} — 2am`,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      siteName: "2am",
      type: "article",
      authors: [AUTHOR.name],
      images: [{ url: OG_IMAGE }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [OG_IMAGE],
    },
  };
}

export default function BlogPostPage({ params }: Props) {
  const post = getPost(params.slug);
  if (!post) notFound();

  const url = `${SITE}/blog/${post.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: {
      "@type": "Person",
      name: AUTHOR.name,
      jobTitle: AUTHOR.role,
      url: AUTHOR.url,
      description: AUTHOR.bio,
    },
    publisher: {
      "@type": "Organization",
      name: "2am",
      url: SITE,
      logo: { "@type": "ImageObject", url: `${SITE}/icon.svg` },
    },
    image: [OG_IMAGE],
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  const faqJsonLd =
    post.faqs && post.faqs.length
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null;

  return (
    <main className="legal-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <div className="legal-container">
        <Link href="/blog" className="legal-back">
          ← back to blog
        </Link>
        <Link href="/" className="legal-logo" aria-label="2am — home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/wordmark.svg" alt="2am" className="legal-logo-img" />
        </Link>

        <h1 className="legal-title">{post.title}</h1>
        <div className="blog-meta-row">
          <span className="blog-tag">{AUDIENCE_LABEL[post.audience]}</span>
          <span className="blog-byline">
            by {AUTHOR.name}, {AUTHOR.role}
          </span>
        </div>

        <article
          className="blog-article"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <aside className="blog-author">
          <div className="blog-author-name">
            {AUTHOR.name}, {AUTHOR.role}
          </div>
          <p>{AUTHOR.bio}</p>
        </aside>

        <section className="blog-cta">
          <p>
            have a question you&apos;d never google? myla answers at 2 a.m.
            with zero judgment.
          </p>
          <Link href="/app/auth">meet myla →</Link>
        </section>

        <footer className="legal-footer">
          <Link href="/" className="legal-footer-brand" aria-label="2am — home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/wordmark.svg" alt="2am" className="legal-footer-wordmark" />
          </Link>
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
