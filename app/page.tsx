// BETA MODE (active): the "meet myla" CTA goes straight to /app/auth
// (signup). A subdued secondary email capture under the hero collects
// testers for the small-batch beta via the same /api/waitlist endpoint.
// The bottom of the page is feedback + FAQ (not a second CTA).

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getRecentPosts } from "@/lib/blog/posts";
import WaitlistForm from "@/components/WaitlistForm";
import "./landing.css";

export const metadata: Metadata = {
  title:
    "2am — myla's always up. | the judgment-free friend for trying, pregnancy & new motherhood",
  description:
    "the judgment-free friend for your journey — whether you're trying, expecting, or navigating life as a new mom. no google history. no embarrassment. just answers.",
  openGraph: {
    title:
      "2am — myla's always up. | the judgment-free friend for trying, pregnancy & new motherhood",
    description:
      "the judgment-free friend for your journey — whether you're trying, expecting, or navigating life as a new mom.",
    url: "https://hey2am.app",
    siteName: "2am",
    type: "website",
    images: [
      {
        url: "https://hey2am.app/og-image.png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "2am — myla's always up. | the judgment-free friend for trying, pregnancy & new motherhood",
    description:
      "the judgment-free friend for your journey — whether you're trying, expecting, or navigating life as a new mom.",
    images: ["https://hey2am.app/og-image.png"],
  },
};

const STARS = [
  { top: "12%", left: "8%", delay: "0s" },
  { top: "22%", left: "76%", delay: "1.2s" },
  { top: "38%", left: "18%", delay: "2.1s" },
  { top: "44%", left: "62%", delay: "0.6s" },
  { top: "56%", left: "30%", delay: "2.8s" },
  { top: "64%", left: "84%", delay: "1.8s" },
  { top: "72%", left: "46%", delay: "0.3s" },
  { top: "82%", left: "14%", delay: "3.2s" },
  { top: "14%", left: "42%", delay: "2.5s" },
  { top: "28%", left: "90%", delay: "0.9s" },
];

const TTC_BUBBLES = [
  "how long should we try before seeing a doctor?",
  "does ovulation tracking actually work?",
  "is it normal to feel jealous of pregnant friends?",
];

const EXP_BUBBLES = [
  "can i eat sushi?",
  "can i drink coffee?",
  "can i take tylenol?",
  "can i dye my hair?",
  "is heartburn normal at 14 weeks?",
  "why do i feel contractions that come and go?",
];

const MOM_BUBBLES = [
  "do i have ppd or am i just tired?",
  "is my baby behind on milestones?",
  "why won’t my baby latch?",
  "how long will this postpartum bleeding last?",
];

export default function Landing({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Safety net: if a Supabase verification email is configured to land on
  // SITE_URL with no path, users arrive here with ?code= or ?token_hash=
  // still attached. Forward them to the right handler so the session
  // actually gets exchanged.
  const code = typeof searchParams.code === "string" ? searchParams.code : null;
  const tokenHash =
    typeof searchParams.token_hash === "string" ? searchParams.token_hash : null;
  const type = typeof searchParams.type === "string" ? searchParams.type : null;
  const next =
    typeof searchParams.next === "string" && searchParams.next.startsWith("/")
      ? searchParams.next
      : "/app/home";

  if (code) {
    redirect(`/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`);
  }
  if (tokenHash && type) {
    redirect(
      `/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}&next=${encodeURIComponent(next)}`,
    );
  }

  const recentPosts = getRecentPosts(3);

  return (
    <>
      {/* top nav */}
      <header className="landing-header">
        <Link href="/" className="landing-navbrand" aria-label="2am — home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/wordmark.svg" alt="2am" className="landing-navbrand-img" />
        </Link>
        <nav className="landing-topnav" aria-label="primary">
          <Link href="/about">about</Link>
          <Link href="/blog">blog</Link>
        </nav>
      </header>

      {/* hero */}
      <header className="landing-hero">
        <div className="landing-stars" aria-hidden>
          {STARS.map((s, i) => (
            <span
              key={i}
              style={{ top: s.top, left: s.left, animationDelay: s.delay }}
            />
          ))}
        </div>
        <div className="landing-container">
          <span className="landing-mono">for every stage of motherhood</span>
          <h1 className="landing-hero-h1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/wordmark.svg" alt="2am" className="landing-hero-wordmark" />
          </h1>
          <p className="landing-tag">myla’s always up.</p>
          <p className="landing-sub">
            the judgment-free friend for your journey — whether you’re
            trying, expecting, or navigating life as a new mom.
          </p>
          <Link className="landing-cta" href="/app/auth">
            meet myla
          </Link>
          <p className="landing-tiny landing-mono">
            no judgment · no google history · just answers
          </p>
          <div className="landing-secondary-capture">
            <p className="landing-secondary-capture-prompt">
              we&rsquo;re inviting testers in small batches — drop your email
              and we&rsquo;ll let you know when there&rsquo;s a spot. 💛
            </p>
            <WaitlistForm
              source="hero-secondary"
              variant="secondary"
              placeholder="your email"
              submitLabel="keep me posted"
              submittingLabel="sending…"
              successMessage={<>got it — we&rsquo;ll check in soon 💛</>}
            />
          </div>
        </div>
      </header>

      {/* problem */}
      <section className="landing-section landing-problem">
        <div className="landing-container">
          <span className="landing-eyebrow landing-mono">
            the 2am google search
          </span>
          <h2 className="landing-title">
            it’s 2am. you’re wide awake. and you have questions you don’t want
            anyone to hear you ask.
          </h2>
          <p className="landing-lede">
            every woman i’ve ever known has spiraled on webmd at midnight.
            crowdsourced her symptoms from strangers on reddit. been too
            embarrassed to bother her ob for the fifth time this week. myla is
            the friend who actually knows her stuff and isn’t going anywhere.
          </p>
          <ul>
            <li>“is this normal, or should i be worried?”</li>
            <li>“i’m scared to bring this up with my doctor.”</li>
            <li>
              “everyone in my group chat got pregnant on the first try.”
            </li>
            <li>“i don’t know what to trust online.”</li>
          </ul>
        </div>
      </section>

      {/* stage cards */}
      <section className="landing-section landing-stages">
        <div className="landing-container">
          <span className="landing-eyebrow landing-mono">for every stage</span>
          <h2 className="landing-title">three chapters, one friend.</h2>
          <p className="landing-lede">
            myla meets you where you are, and she remembers. no starting over,
            no re-explaining. she grows with you.
          </p>

          <div className="landing-stage-grid">
            <article className="landing-stage-card trying">
              <div className="emoji" aria-hidden>
                🌱
              </div>
              <h3>trying</h3>
              <p>
                <em>
                  “how long is too long?” “should i be tracking ovulation?” “is
                  something wrong with us?”
                </em>
                {" "}— the questions you’re afraid to ask your friends who got
                pregnant on the first try.
              </p>
            </article>

            <article className="landing-stage-card expecting">
              <div className="emoji" aria-hidden>
                🤍
              </div>
              <h3>expecting</h3>
              <p>
                <em>
                  “is this normal?” “can i eat this?” “why do i feel like
                  this?”
                </em>
                {" "}— the 2am questions about your body, your baby, and
                everything you’re too embarrassed to google.
              </p>
            </article>

            <article className="landing-stage-card newmom">
              <div className="emoji" aria-hidden>
                🍼
              </div>
              <h3>new mom</h3>
              <p>
                <em>
                  “is my baby behind?” “do i have ppd or am i just tired?”
                  “why won’t my baby latch?”
                </em>
                {" "}— the postpartum questions nobody warns you about,
                without the judgment of mom groups.
              </p>
            </article>
          </div>
          <p
            style={{
              fontFamily: "var(--font-outfit), system-ui, sans-serif",
              fontSize: "16px",
              fontStyle: "italic",
              color: "rgba(255, 255, 255, 0.35)",
              maxWidth: "560px",
              margin: "32px auto 0",
              textAlign: "center",
            }}
          >
            whether you’re doing this with a partner, on your own, or with a
            team of doctors helping you get there — myla’s here for all of it.
          </p>
        </div>
      </section>

      {/* how it works */}
      <section className="landing-section landing-how">
        <div className="landing-container">
          <span className="landing-eyebrow landing-mono">how it works</span>
          <h2 className="landing-title">three steps. no forms. no judgment.</h2>
          <div className="landing-how-grid">
            <article className="landing-how-card">
              <div className="landing-how-num" aria-hidden>
                1
              </div>
              <h3>tell myla what’s on your mind.</h3>
              <p>
                whether it’s a question, a fear, or something you just need to
                say out loud. no forms, no dropdown menus. just talk.
              </p>
            </article>
            <article className="landing-how-card">
              <div className="landing-how-num" aria-hidden>
                2
              </div>
              <h3>she asks the right follow-ups.</h3>
              <p>
                myla doesn’t give generic answers. she asks what week you’re in,
                what you’ve already tried, what’s actually worrying you — then
                gives you the real answer.
              </p>
            </article>
            <article className="landing-how-card">
              <div className="landing-how-num" aria-hidden>
                3
              </div>
              <h3>she remembers, so you never start over.</h3>
              <p>
                next time you come back, myla knows your name, your stage, and
                what you talked about last. like a friend who actually listens.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* question bubbles */}
      <section className="landing-section landing-bubbles">
        <div className="landing-container">
          <span className="landing-eyebrow landing-mono">
            what women actually ask
          </span>
          <h2 className="landing-title">
            the stuff we’ve all quietly typed and deleted.
          </h2>
          <div className="landing-bubble-cloud">
            {TTC_BUBBLES.map((q) => (
              <span key={q} className="landing-bubble ttc">
                {q}
              </span>
            ))}
            {EXP_BUBBLES.map((q) => (
              <span key={q} className="landing-bubble exp">
                {q}
              </span>
            ))}
            {MOM_BUBBLES.map((q) => (
              <span key={q} className="landing-bubble mom">
                {q}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* testimonials */}
      <section className="landing-section landing-testimonials">
        <div className="landing-container">
          <span className="landing-eyebrow landing-mono">
            built for moments like these
          </span>
          <h2 className="landing-title">
            the questions you’d never ask out loud.
          </h2>
          <div className="landing-t-grid">
            <figure className="landing-testimonial">
              <blockquote>
                “i accidentally had a glass of wine before i knew i was
                pregnant. is my baby okay?”
              </blockquote>
              <cite>— 3:47 am</cite>
              <div className="who">
                myla answered in 8 seconds. no judgment. just reassurance.
              </div>
            </figure>

            <figure className="landing-testimonial">
              <blockquote>
                “we’ve been trying for 14 months. is something wrong with me?”
              </blockquote>
              <cite>— 1:22 am</cite>
              <div className="who">
                myla talked her through the numbers, the options, and reminded
                her she’s not alone.
              </div>
            </figure>

            <figure className="landing-testimonial">
              <blockquote>
                “my baby is 4 months old and i don’t feel bonded yet. am i a
                bad mom?”
              </blockquote>
              <cite>— 2:08 am</cite>
              <div className="who">
                myla normalized it, explained the science, and gently
                suggested talking to her doctor.
              </div>
            </figure>
          </div>
        </div>
      </section>

      {/* from the blog */}
      <section className="landing-section landing-blog-preview">
        <div className="landing-container">
          <span className="landing-eyebrow landing-mono">from the blog</span>
          <h2 className="landing-title">
            answers for the questions you’d never google.
          </h2>
          <ul className="landing-blog-list">
            {recentPosts.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`}>
                  <span className="t">{p.title}</span>
                  <span className="d">{p.audience}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div>
            <Link href="/blog" className="landing-blog-more">
              read more →
            </Link>
          </div>
        </div>
      </section>

      {/* early-tester feedback */}
      <section className="landing-section landing-feedback">
        <div className="landing-container">
          <span className="landing-eyebrow landing-mono">
            what early testers are telling us
          </span>
          <h2 className="landing-title">the feedback we keep hearing.</h2>
          <div className="landing-feedback-grid">
            <figure className="landing-feedback-card ttc">
              <blockquote>
                “i’ve been trying for 11 months and every other app made me
                feel like a project. myla just talked to me. she didn’t tell
                me to relax or try harder.”
              </blockquote>
              <cite>— sarah, cycle 11</cite>
            </figure>
            <figure className="landing-feedback-card exp">
              <blockquote>
                “i texted myla at 4 am about brown spotting at 8 weeks. she
                told me what was likely and what wasn’t, and said ‘this is
                worth a call to your OB in the morning, but it’s not an
                emergency tonight.’ i actually went back to sleep.”
              </blockquote>
              <cite>— jess, 8 weeks</cite>
            </figure>
            <figure className="landing-feedback-card mom">
              <blockquote>
                “i thought i was the only one who hadn’t felt that
                bonded-from-day-one thing. myla explained why it’s normal,
                told me when it usually shifts, and said the part i needed to
                hear: ‘this doesn’t mean you’re a bad mom.’”
              </blockquote>
              <cite>— maya, 9 weeks postpartum</cite>
            </figure>
          </div>
          <p className="landing-feedback-note landing-mono">
            names and details changed for privacy.
          </p>
        </div>
      </section>

      {/* faq */}
      <section className="landing-section landing-faq">
        <div className="landing-container">
          <span className="landing-eyebrow landing-mono">common questions</span>
          <h2 className="landing-title">
            what people ask before they meet myla.
          </h2>
          <div className="landing-faq-list">
            <details className="landing-faq-item">
              <summary>is myla free?</summary>
              <div className="landing-faq-answer">
                yes — free during beta. when we open public access, the core
                experience will stay free. we may add a paid tier later for
                things like longer memory or extra features, but the questions
                you’d never google will always be free to ask.
              </div>
            </details>
            <details className="landing-faq-item">
              <summary>when does the app launch?</summary>
              <div className="landing-faq-answer">
                right now we’re in private beta with a small group of testers.
                we’re opening access in small batches. drop your email above
                and we’ll let you know when there’s a spot.
              </div>
            </details>
            <details className="landing-faq-item">
              <summary>how is this different from just asking chatgpt?</summary>
              <div className="landing-faq-answer">
                three things. one — myla is trained specifically on guidelines
                from organizations like ACOG, the CDC, and the AAP, so the
                answers are evidence-based rather than averaged across the
                whole internet. two — she remembers your story, so you never
                have to re-explain that you’re 14 weeks pregnant or that you’ve
                been trying for 8 months. three — she’s built for the 2 am
                emotional register: warm, not clinical. she knows the
                difference between someone asking a factual question and
                someone asking because they’re scared.
              </div>
            </details>
            <details className="landing-faq-item">
              <summary>what happens to my chat history? is it private?</summary>
              <div className="landing-faq-answer">
                your conversations are yours. we don’t sell your data. we don’t
                show you ads. we don’t share it with insurers, advertisers, or
                anyone else. if you want, you can delete any conversation or
                your entire history at any time.
              </div>
            </details>
            <details className="landing-faq-item">
              <summary>is myla a doctor? can she diagnose me?</summary>
              <div className="landing-faq-answer">
                no. myla is an ai friend, not a medical provider. she doesn’t
                diagnose, prescribe, or replace your OB. she helps you figure
                out which questions are worth bringing to your doctor, and
                tells you when something needs a call tonight vs. when it can
                wait.
              </div>
            </details>
            <details className="landing-faq-item">
              <summary>what if i’m in a mental health crisis at 2 am?</summary>
              <div className="landing-faq-answer">
                myla is trained to recognize when something is beyond her
                scope. if you mention thoughts of self-harm, severe postpartum
                symptoms, or a medical emergency, she’ll tell you to reach out
                to a real human and give you the right resource right there in
                the chat. she’s never a substitute for real help. she’s the
                friend who tells you to go get it.
              </div>
            </details>
            <details className="landing-faq-item">
              <summary>what devices does this work on?</summary>
              <div className="landing-faq-answer">
                right now myla lives in your browser — so it works on any
                phone, tablet, or computer. a dedicated iOS app is coming soon.
              </div>
            </details>
            <details className="landing-faq-item">
              <summary>who built this?</summary>
              <div className="landing-faq-answer">
                ali miller, from cape coral, florida. not a health tech
                conglomerate.{" "}
                <Link href="/about" className="landing-faq-link">
                  read the full story →
                </Link>
              </div>
            </details>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <Link href="/" className="landing-footer-brand" aria-label="2am — home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/wordmark.svg" alt="2am" className="landing-footer-wordmark" />
        </Link>
        <span className="landing-mono">hey2am.app</span>
        <div style={{ marginTop: 16 }}>
          © 2026 2AM. myla is an ai friend, not a medical provider.
          {" · "}
          <Link href="/about" className="landing-footer-link">
            about
          </Link>
          {" · "}
          <Link href="/blog" className="landing-footer-link">
            blog
          </Link>
          {" · "}
          <Link href="/privacy" className="landing-footer-link">
            privacy
          </Link>
          {" · "}
          <Link href="/terms" className="landing-footer-link">
            terms
          </Link>
        </div>
      </footer>
    </>
  );
}
