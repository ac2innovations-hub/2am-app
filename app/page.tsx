// POST-LAUNCH: When you're ready to open the app:
//   1. Change the hero CTA back to <Link href="/app">meet myla</Link>
//   2. Replace <WaitlistForm /> usages with the same CTA
//   3. Delete components/WaitlistForm.tsx and the waitlist styles in
//      app/landing.css
//   4. Re-add the footer app link if desired

import type { Metadata } from "next";
import Link from "next/link";
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

export default function Landing() {
  return (
    <>
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
          <h1>2am</h1>
          <p className="landing-tag">myla’s always up.</p>
          <p className="landing-sub">
            the judgment-free friend for your journey — whether you’re
            trying, expecting, or navigating life as a new mom.
          </p>
          {/* POST-LAUNCH: change this back to <Link href="/app">meet myla</Link> */}
          <a className="landing-cta" href="#waitlist">
            join the waitlist
          </a>
          <p className="landing-tiny landing-mono">
            no judgment · no google history · just answers
          </p>
        </div>
      </header>

      {/* waitlist — hero form */}
      <section id="waitlist" className="landing-waitlist-section">
        <div className="landing-container">
          <span className="landing-eyebrow landing-mono">
            myla is almost ready
          </span>
          <h2 className="landing-title">be the first in.</h2>
          <p className="landing-lede" style={{ margin: "0 auto 28px" }}>
            we’re opening the door soon. drop your email and we’ll let you
            know the minute myla is live.
          </p>
          <WaitlistForm source="hero" />
          <p className="landing-waitlist-note">
            no spam. no data selling. ever. we mean it.
          </p>
        </div>
      </section>

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
          <h2 className="landing-title">three chapters, one companion.</h2>
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

      {/* final cta — second waitlist form */}
      <section className="landing-final">
        <span className="landing-mono">whenever you need her</span>
        <h2 className="landing-title">myla’s always up.</h2>
        <p className="landing-lede">
          trying, expecting, or holding a brand new human at 3am — she’ll be
          right here.
        </p>
        <div style={{ marginTop: 32 }}>
          {/* POST-LAUNCH: replace with <Link className="landing-cta" href="/app">meet myla</Link> */}
          <WaitlistForm source="final-cta" />
        </div>
      </section>

      <footer className="landing-footer">
        <span className="landing-mono">hey2am.app</span>
        <div style={{ marginTop: 16 }}>
          © 2026 2AM. myla is an ai companion, not a medical provider.
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
