import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AUTHOR,
  POSTS,
  STAGE_META,
  getAllPosts,
  getPost,
  readingMinutes,
} from "@/lib/blog/posts";
import SiteNav from "@/components/site/SiteNav";
import SiteFooter from "@/components/site/SiteFooter";
import "../../landing.css";

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
  const minutes = readingMinutes(post.content);
  const stage = STAGE_META[post.audience];

  // Related: same-stage posts first, then the rest — up to 3.
  const related = getAllPosts()
    .filter((p) => p.slug !== post.slug)
    .sort(
      (a, b) =>
        (a.audience === post.audience ? 0 : 1) -
        (b.audience === post.audience ? 0 : 1),
    )
    .slice(0, 3);

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
    <>
      <SiteNav />
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
      <main className="post-page">
        <article className="post-article">
          <Link href="/blog" className="post-back landing-mono">
            ← all articles
          </Link>

          <div className="post-meta">
            <span
              className="post-meta-tag"
              style={{ color: stage.hex ?? "#8b97ae" }}
            >
              {stage.tag}
            </span>
            <span className="dot" aria-hidden />
            <span className="muted">{minutes} min read</span>
          </div>

          <h1 className="post-title">{post.title}</h1>
          <p className="post-dek">{post.description}</p>
          <div className="post-rule" aria-hidden />

          <div
            className="post-body"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>

        {/* ask myla */}
        <section className="post-cta-wrap">
          <div className="post-cta">
            <div className="post-cta-mark" aria-hidden>
              m
            </div>
            <div className="post-cta-text">
              <div className="post-cta-title">still have a question?</div>
              <div className="post-cta-sub">
                ask myla — she&rsquo;ll answer it for exactly where you are.
              </div>
            </div>
            <Link href="/app/try" className="post-cta-btn">
              ask myla
            </Link>
          </div>
        </section>

        {/* keep reading */}
        {related.length > 0 && (
          <section className="post-related">
            <div className="post-related-label landing-mono">keep reading</div>
            <div className="post-related-list">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="post-related-item"
                >
                  <div>
                    <div
                      className="post-related-tag"
                      style={{ color: STAGE_META[r.audience].hex ?? "#8b97ae" }}
                    >
                      {STAGE_META[r.audience].tag}
                    </div>
                    <div className="post-related-title">{r.title}</div>
                  </div>
                  <span className="chev" aria-hidden>
                    ›
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
