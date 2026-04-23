import type { Metadata } from "next";
import Link from "next/link";
import "../legal.css";

export const metadata: Metadata = {
  title: "why 2am exists — the judgment-free friend for your journey",
  description:
    "2am is an ai-powered friend for the questions women have at 2 am. founded by ali miller. warm, evidence-based, judgment-free.",
  alternates: { canonical: "https://hey2am.app/about" },
  openGraph: {
    title: "why 2am exists",
    description:
      "2am is an ai-powered friend for the questions women have at 2 am. warm, evidence-based, judgment-free.",
    url: "https://hey2am.app/about",
    siteName: "2am",
    type: "website",
    images: [{ url: "https://hey2am.app/og-image.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "why 2am exists",
    description:
      "2am is an ai-powered friend for the questions women have at 2 am.",
    images: ["https://hey2am.app/og-image.png"],
  },
};

export default function AboutPage() {
  return (
    <main className="legal-page">
      <div className="legal-container">
        <Link href="/" className="legal-back">
          ← back to home
        </Link>
        <Link href="/" className="legal-logo">
          2am
        </Link>

        <h1 className="legal-title">why 2am exists</h1>

        <section className="legal-section about-prose">
          <p>
            every woman on this journey — trying, expecting, or navigating new
            motherhood — has had the same moment.
          </p>
          <p>
            it&apos;s late. maybe it&apos;s actually 2 am. you&apos;re lying in
            bed with a question you can&apos;t shake. something you noticed,
            something you felt, something someone said that you can&apos;t
            stop thinking about.
          </p>
          <p>
            you pick up your phone. you start to type it into google. then you
            stop — because the last time you did that, you ended up on page
            three of a forum from 2014 convinced something was terribly wrong.
          </p>
          <p>
            you think about texting your friend. but it&apos;s late. and
            honestly, you&apos;re not sure you want to say it out loud.
          </p>
          <p>so you just... sit with it. alone. wondering.</p>
          <p>that moment is why we built 2am.</p>
        </section>

        <section className="legal-section about-prose">
          <h2>who we are</h2>
          <p>
            2am was founded by ali miller in cape coral, florida. not by a
            health tech conglomerate. not by a team of MBAs optimizing for ad
            revenue. by a person who saw a gap and decided to fill it.
          </p>
          <p>
            the gap is simple: millions of women have questions they&apos;re
            too embarrassed, too scared, or too exhausted to ask — and the
            options for answers aren&apos;t great. google is terrifying. mom
            groups are judgmental. your doctor&apos;s office is closed at 2
            am.
          </p>
          <p>
            myla is the answer. she&apos;s an ai-powered friend (not a doctor,
            not a search engine, not a forum) who&apos;s always awake, never
            judges, and actually remembers your name, your story, and your
            concerns.
          </p>
        </section>

        <section className="legal-section">
          <h2>what we believe</h2>
          <p className="about-belief">
            <strong>&ldquo;every question is a good question.&rdquo;</strong>
            especially at 2 am. especially the ones you&apos;d never say out
            loud.
          </p>
          <p className="about-belief">
            <strong>&ldquo;judgment has no place here.&rdquo;</strong> not
            about what you eat, how you feed your baby, how long you&apos;ve
            been trying, or how you&apos;re feeling. ever.
          </p>
          <p className="about-belief">
            <strong>&ldquo;your data is yours.&rdquo;</strong> we don&apos;t
            sell it. we don&apos;t show you ads. we don&apos;t make money by
            exploiting your most vulnerable moments.
          </p>
          <p className="about-belief">
            <strong>
              &ldquo;ai should make you feel less alone, not more
              confused.&rdquo;
            </strong>
            myla is warm, direct, and evidence-based. she knows when to
            reassure you and when to say &ldquo;call your doctor.&rdquo;
          </p>
          <p className="about-belief">
            <strong>&ldquo;every stage matters.&rdquo;</strong> trying to
            conceive isn&apos;t a footnote. postpartum isn&apos;t an
            afterthought. and pregnancy isn&apos;t one-size-fits-all.
          </p>
        </section>

        <section className="legal-section about-prose">
          <h2>what myla is (and isn&apos;t)</h2>
          <p>
            myla is powered by ai. she&apos;s trained on real medical
            guidelines from organizations like ACOG, the CDC, and the AAP.
            she&apos;s designed to be the friend you text at 2 am — warm,
            direct, judgment-free, and actually helpful.
          </p>
          <p>
            she is not a doctor. she doesn&apos;t diagnose or prescribe. she
            knows when something is beyond her scope and she&apos;ll always
            tell you to call your provider when it matters.
          </p>
          <p>
            think of her as the most well-read friend you&apos;ve ever had —
            one who never sleeps, never judges, and never makes you feel
            stupid for asking.
          </p>
        </section>

        <section className="legal-section">
          <h2>get in touch</h2>
          <p className="about-contact">
            email:{" "}
            <a href="mailto:ali@hey2am.app">ali@hey2am.app</a>
          </p>
          <p className="about-contact">
            tiktok:{" "}
            <a
              href="https://www.tiktok.com/@hey2am.app"
              target="_blank"
              rel="noopener noreferrer"
            >
              @hey2am.app
            </a>
          </p>
          <p className="about-contact">
            instagram:{" "}
            <a
              href="https://www.instagram.com/hey2amapp"
              target="_blank"
              rel="noopener noreferrer"
            >
              @hey2amapp
            </a>
          </p>
          <p className="about-contact">
            threads:{" "}
            <a
              href="https://www.threads.net/@hey2amapp"
              target="_blank"
              rel="noopener noreferrer"
            >
              @hey2amapp
            </a>
          </p>
        </section>

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
