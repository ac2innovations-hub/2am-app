import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/site/SiteNav";
import SiteFooter from "@/components/site/SiteFooter";
import "../landing.css";

export const metadata: Metadata = {
  title: "why 2am exists — the judgment-free friend for your journey",
  description:
    "2am is an ai-powered friend for the questions women have at 2 a.m. founded by ali miller. warm, evidence-based, judgment-free.",
  alternates: { canonical: "https://www.hey2am.app/about" },
  openGraph: {
    title: "why 2am exists",
    description:
      "2am is an ai-powered friend for the questions women have at 2 a.m. warm, evidence-based, judgment-free.",
    url: "https://www.hey2am.app/about",
    siteName: "2am",
    type: "website",
    images: [{ url: "https://www.hey2am.app/og-image.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "why 2am exists",
    description:
      "2am is an ai-powered friend for the questions women have at 2 a.m.",
    images: ["https://www.hey2am.app/og-image.png"],
  },
};

export default function AboutPage() {
  return (
    <>
      <SiteNav />
      <main className="about-page">
        {/* hero */}
        <section className="about-hero">
          <div className="about-hero-glow" aria-hidden />
          <div className="about-hero-inner">
            <div className="about-eyebrow landing-mono">the story behind 2am</div>
            <h1 className="about-h1">it was built by someone who was up too.</h1>
            <p className="about-dek">
              2am didn&rsquo;t come from a lab or a boardroom. it came from years
              of lying awake with questions i couldn&rsquo;t ask anyone.
            </p>
          </div>
        </section>

        {/* founder + story */}
        <section className="about-body">
          <div className="about-founder-row">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/founder-ali.png"
              alt="ali miller"
              className="about-founder-photo"
            />
            <div>
              <div className="about-founder-name">ali miller</div>
              <div className="about-founder-role landing-mono">
                founder · still awake at 2am
              </div>
            </div>
          </div>

          <div className="about-copy">
            <p>
              2am was founded by ali miller in cape coral, florida — not by a
              health-tech conglomerate, not by a team of mbas optimizing for ad
              revenue. by a person who saw a gap and decided to fill it.
            </p>
            <p>
              the gap is simple: millions of women have questions they&rsquo;re
              too embarrassed, too scared, or too exhausted to ask — and the
              options for answers aren&rsquo;t great. google is terrifying. mom
              groups are judgmental. your doctor&rsquo;s office is closed at 2
              a.m.
            </p>
            <p>
              myla is the answer. <strong>she&rsquo;s the friend who happens to
              have read everything</strong> — not a doctor, not a search engine,
              not a forum — who&rsquo;s always awake, never judges, and actually
              remembers your name, your story, and your concerns.
            </p>
          </div>

          <blockquote className="about-pullquote">
            &ldquo;your data is yours. we don&rsquo;t sell it, we don&rsquo;t show
            you ads, and we never make money by exploiting your most vulnerable
            moments.&rdquo;
          </blockquote>

          <div className="about-copy">
            <p>
              myla is powered by ai, grounded in real clinical guidance from
              organizations like acog, the cdc, and the aap. she&rsquo;s designed
              to be the friend you text at 2 a.m. — warm, direct, judgment-free,
              and actually helpful.
            </p>
            <p>
              she is not a doctor. she doesn&rsquo;t diagnose or prescribe. she
              knows when something is beyond her scope, and she&rsquo;ll always
              tell you to call your provider when it matters. think of her as the
              most well-read friend you&rsquo;ve ever had — one who never sleeps,
              never judges, and never makes you feel stupid for asking.
            </p>
          </div>

          <p className="about-contact">
            reach me:{" "}
            <a href="mailto:ali@hey2am.app">ali@hey2am.app</a>
            {" · "}
            <a
              href="https://www.tiktok.com/@hey2am.app"
              target="_blank"
              rel="noopener noreferrer"
            >
              tiktok
            </a>
            {" · "}
            <a
              href="https://www.instagram.com/hey2amapp"
              target="_blank"
              rel="noopener noreferrer"
            >
              instagram
            </a>
            {" · "}
            <a
              href="https://www.threads.net/@hey2amapp"
              target="_blank"
              rel="noopener noreferrer"
            >
              threads
            </a>
          </p>
        </section>

        {/* the promise — 3-up */}
        <section className="about-grid-wrap">
          <div className="about-grid">
            <div className="about-grid-card">
              <div className="h">never ads.</div>
              <div className="p">
                not now, not once there&rsquo;s scale to sell. the feed will
                never be for sale.
              </div>
            </div>
            <div className="about-grid-card">
              <div className="h">never data sales.</div>
              <div className="p">
                your history is yours. it isn&rsquo;t shared with insurers,
                advertisers, or anyone.
              </div>
            </div>
            <div className="about-grid-card">
              <div className="h">never judgment.</div>
              <div className="p">
                no exceptions. the whole point is a place the question isn&rsquo;t
                too much.
              </div>
            </div>
          </div>
        </section>

        {/* closing cta */}
        <section className="about-closing">
          <div className="about-closing-glow" aria-hidden />
          <div className="about-closing-inner">
            <h2 className="about-closing-h2">meet the friend i wish i&rsquo;d had.</h2>
            <Link className="landing-cta" href="/app/try">
              meet myla
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
