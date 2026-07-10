import type { Metadata } from "next";
import { getAllPosts, readingMinutes } from "@/lib/blog/posts";
import SiteNav from "@/components/site/SiteNav";
import SiteFooter from "@/components/site/SiteFooter";
import BlogIndexClient from "@/components/blog/BlogIndexClient";
import "../landing.css";

export const metadata: Metadata = {
  title: "2am blog — answers for the questions you'd never google",
  description:
    "evidence-based answers to the questions women ask at 2 a.m. trying to conceive, pregnancy, and postpartum — no judgment, just information.",
  alternates: { canonical: "https://www.hey2am.app/blog" },
  openGraph: {
    title: "2am blog — answers for the questions you'd never google",
    description:
      "evidence-based answers to the questions women ask at 2 a.m. trying to conceive, pregnancy, and postpartum — no judgment, just information.",
    url: "https://www.hey2am.app/blog",
    siteName: "2am",
    type: "website",
    images: [{ url: "https://www.hey2am.app/og-image.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "2am blog",
    description:
      "evidence-based answers to the questions women ask at 2 a.m.",
    images: ["https://www.hey2am.app/og-image.png"],
  },
};

const FEATURED_SLUG = "can-i-eat-sushi-while-pregnant";

export default function BlogIndexPage() {
  const posts = getAllPosts().map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    audience: p.audience,
    readMinutes: readingMinutes(p.content),
  }));

  return (
    <>
      <SiteNav />
      <main className="blogidx-page">
        <BlogIndexClient posts={posts} featuredSlug={FEATURED_SLUG} />
      </main>
      <SiteFooter />
    </>
  );
}
