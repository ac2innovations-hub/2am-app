// The "meet myla" CTA goes to /app/try (the anonymous try-Myla flow, with a
// persistent "log in" escape hatch); logged-in visitors are redirected to
// /app/chat above. The hero carries an interactive Myla demo; the rest is
// moments · memory · clinical review · why-not-chatgpt · promise · faq ·
// blog · closing CTA.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getRecentPosts } from "@/lib/blog/posts";
import AppStoreBadge from "@/components/AppStoreBadge";
import MylaDemo from "@/components/landing/MylaDemo";
import SiteNav from "@/components/site/SiteNav";
import SiteFooter from "@/components/site/SiteFooter";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import "./landing.css";

export const metadata: Metadata = {
  title:
    "2am — the judgment-free pregnancy, ttc & postpartum friend",
  description:
    "the judgment-free friend for your journey — whether you're trying, expecting, or navigating life as a new mom. no google history. no embarrassment. just answers.",
  alternates: { canonical: "/" },
  openGraph: {
    title:
      "2am — the judgment-free pregnancy, ttc & postpartum friend",
    description:
      "the judgment-free friend for your journey — whether you're trying, expecting, or navigating life as a new mom.",
    url: "https://www.hey2am.app",
    siteName: "2am",
    type: "website",
    images: [
      {
        url: "https://www.hey2am.app/og-image.png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "2am — the judgment-free pregnancy, ttc & postpartum friend",
    description:
      "the judgment-free friend for your journey — whether you're trying, expecting, or navigating life as a new mom.",
    images: ["https://www.hey2am.app/og-image.png"],
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

export default async function Landing({
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

  // Entry routing (Spec #4, case 1): a logged-in visitor goes straight to the
  // Myla chat — not the marketing page or the dashboard. Logged-out visitors
  // fall through to the landing page, where "meet myla" → signup/try-flow.
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/app/chat");
  }

  const recentPosts = getRecentPosts(3);

  return (
    <>
      {/* top nav */}
      <SiteNav />

      {/* hero — headline left, interactive chat demo right */}
      <header className="landing-hero2">
        <div className="landing-stars" aria-hidden>
          {STARS.map((s, i) => (
            <span
              key={i}
              style={{ top: s.top, left: s.left, animationDelay: s.delay }}
            />
          ))}
        </div>
        <div className="landing-hero2-grid">
          <div>
            {/* sr-only h1 carries the keyword-rich topic for SEO; the visible
                headline below is the styled display lockup. */}
            <h1 className="sr-only">
              2am — the judgment-free ai friend for trying to conceive,
              pregnancy, and new motherhood
            </h1>
            <div className="landing-hero2-eyebrow landing-mono">
              for trying · expecting · new moms
            </div>
            <div className="landing-hero2-h1">
              it’s 2 a.m.
              <br />
              you’re wide awake.
              <br />
              <span>she’s up too.</span>
            </div>
            <p className="landing-hero2-sub">
              myla is the judgment-free friend for trying, expecting, and new
              motherhood. evidence-based, warm, and awake at whatever hour the
              question hits.
            </p>
            <div className="landing-hero2-ctas">
              <Link className="landing-cta" href="/app/try">
                meet myla
              </Link>
              <AppStoreBadge />
            </div>
            <p className="landing-hero2-trust landing-mono">
              free · no ads, ever · reviewed by a board-certified ob-gyn
            </p>
          </div>
          <div className="landing-hero2-demo">
            <MylaDemo />
          </div>
        </div>
      </header>

      {/* built for moments like these */}
      <section className="landing-section landing-testimonials">
        <div className="landing-container">
          <span className="landing-eyebrow landing-mono">
            built for moments like these
          </span>
          <h2 className="landing-title">
            the questions you’d never ask out loud.
          </h2>
          <p className="landing-lede">
            every woman has spiraled on webmd at midnight, crowdsourced her
            symptoms from strangers on reddit, or sat alone with a fear too
            awkward to say out loud. these are real 2 a.m. moments — and what
            happened next.
          </p>
          <div className="landing-t-grid">
            <figure className="landing-testimonial">
              <blockquote>
                “i accidentally had a glass of wine before i knew i was
                pregnant. is my baby okay?”
              </blockquote>
              <cite>— 3:47 am</cite>
              <div className="who">
                myla answered in eight seconds. no judgment — just the actual
                risk, which is far smaller than the fear.
              </div>
            </figure>
            <figure className="landing-testimonial">
              <blockquote>
                “we’ve been trying for 14 months. is something wrong with me?”
              </blockquote>
              <cite>— 1:22 am</cite>
              <div className="who">
                she walked through the real numbers, the real options, and the
                sentence that mattered: you are not broken.
              </div>
            </figure>
            <figure className="landing-testimonial">
              <blockquote>
                “my baby is 4 months old and i don’t feel bonded yet. am i a
                bad mom?”
              </blockquote>
              <cite>— 2:08 am</cite>
              <div className="who">
                she normalized it, explained the science, and suggested a
                conversation with her doctor — for the morning, not for panic.
              </div>
            </figure>
          </div>
        </div>
      </section>

      {/* three chapters, one friend — memory thread */}
      <section className="landing-section landing-chapters">
        <div className="landing-container landing-chapters-grid">
          <div>
            <span className="landing-eyebrow landing-mono">
              three chapters, one friend
            </span>
            <h2 className="landing-title">
              she remembers, so you never start over.
            </h2>
            <p className="landing-lede">
              trying, expecting, new mom — myla carries the whole story. no
              re-explaining what week you’re in, or how long it’s been, or what
              you were scared about last time.
            </p>
            <div className="landing-rail">
              <div className="landing-rail-row">
                <span className="dot" style={{ background: "var(--sage)" }} />
                <span className="k">trying</span>
                <span className="v">cycles, timing, the two-week wait</span>
              </div>
              <div className="landing-rail-row">
                <span className="dot" style={{ background: "var(--peach)" }} />
                <span className="k">expecting</span>
                <span className="v">your body, your baby, can-i-eat-this</span>
              </div>
              <div className="landing-rail-row">
                <span className="dot" style={{ background: "var(--lavender)" }} />
                <span className="k">new mom</span>
                <span className="v">
                  feeding, sleep, the feelings nobody warns you about
                </span>
              </div>
            </div>
          </div>

          <div className="landing-thread">
            <div className="landing-thread-line" aria-hidden />
            <div className="landing-thread-item">
              <span
                className="landing-thread-dot"
                style={{ background: "var(--sage)" }}
              />
              <div className="landing-thread-when landing-mono">
                september · cycle 3
              </div>
              <div className="landing-thread-bubbles">
                <div className="tb user">
                  everyone in my group chat got pregnant on the first try.
                </div>
                <div className="tb myla">
                  and you’re on cycle 3 — which is completely normal. 85% of
                  couples take up to a year. want the real numbers instead of
                  the group chat’s?
                </div>
              </div>
            </div>
            <div className="landing-thread-item">
              <span
                className="landing-thread-dot"
                style={{ background: "var(--peach)" }}
              />
              <div className="landing-thread-when landing-mono">
                february · just found out
              </div>
              <div className="landing-thread-bubbles">
                <div className="tb user">myla. two lines.</div>
                <div className="tb myla">
                  ali — two lines. i’ve been hoping for this message. how are
                  you feeling — excited, terrified, both?
                </div>
              </div>
            </div>
            <div className="landing-thread-item">
              <span
                className="landing-thread-dot"
                style={{ background: "var(--lavender)" }}
              />
              <div className="landing-thread-when landing-mono">
                december · 5 weeks postpartum
              </div>
              <div className="landing-thread-bubbles">
                <div className="tb user">
                  she’s here. why won’t she latch on the left side?
                </div>
                <div className="tb myla">
                  she’s here 🤍 congratulations. and — the left side is almost
                  always position, not you. want to try the football hold at
                  the next feed?
                </div>
              </div>
            </div>
            <p className="landing-thread-note">
              same thread, fifteen months apart. she remembers all of it.
            </p>
          </div>
        </div>
      </section>

      {/* clinical review */}
      <section className="landing-section landing-clinical">
        <div className="landing-container">
          <span className="landing-eyebrow landing-mono">
            reviewed by a board-certified ob-gyn
          </span>
          <blockquote className="landing-clinical-quote">
            “As a board-certified OB/GYN with over a decade of clinical
            experience, I would recommend 2am to all of my patients. It does an
            excellent job of providing patients with honest and accurate medical
            information in a manner that is non-judgmental and allows patients to
            make educated decisions about their care during an important and
            vulnerable period in their lives.”
          </blockquote>
          <div className="landing-clinical-cite">Jill Palko, MD, OB-GYN</div>
          <div className="landing-clinical-banner landing-mono">
            <span aria-hidden />
            grounded in acog · cdc · aap guidance
            <span aria-hidden />
          </div>
        </div>
      </section>

      {/* why not chatgpt */}
      <section className="landing-section landing-versus">
        <div className="landing-container">
          <span className="landing-eyebrow landing-mono">the obvious question</span>
          <h2 className="landing-title">“why not just ask chatgpt?”</h2>
          <p className="landing-lede">
            because a 2 a.m. question is rarely just an information question. the
            same message, answered twice:
          </p>
          <div className="landing-versus-grid">
            <div className="landing-versus-card">
              <div className="landing-versus-label landing-mono">
                a general chatbot
              </div>
              <div className="tb user">
                my baby won’t latch and i feel like a failure
              </div>
              <div className="tb bot">
                A good latch means the baby’s mouth covers most of the areola,
                not just the nipple. Try the cross-cradle or football hold, wait
                for a wide-open mouth, and bring the baby to you. If problems
                persist, consider a lactation consultant.
              </div>
              <div className="landing-versus-kicker landing-mono">
                correct — and it never heard “i feel like a failure.”
              </div>
            </div>
            <div className="landing-versus-card is-myla">
              <div className="landing-versus-label landing-mono">
                <span className="mark" aria-hidden>
                  m
                </span>
                myla
              </div>
              <div className="tb user">
                my baby won’t latch and i feel like a failure
              </div>
              <div className="tb myla">
                first — you are not a failure. i needed to say that before
                anything else. latching is hard, and for reasons that have
                nothing to do with you: how she’s positioned, a possible
                tongue-tie, a latch reflex still figuring itself out.
              </div>
              <div className="tb myla">
                a lactation consultant can genuinely work magic here — most of
                this is fixable with hands-on help. and if breastfeeding ever
                stops being the path, that’s not failure either; a fed, loved
                baby is the whole point. how are you doing in all of it — not
                just the feeding?
              </div>
              <div className="landing-versus-kicker is-myla landing-mono">
                she answered the one you were actually asking.
              </div>
            </div>
          </div>
          <div className="landing-versus-points">
            <div>
              <div className="h">grounded, not averaged.</div>
              <div className="p">
                answers come from acog, cdc and aap guidance — not from the
                whole internet at once.
              </div>
            </div>
            <div>
              <div className="h">she remembers.</div>
              <div className="p">
                your week, your history, your last scare. you never re-explain,
                and she follows up.
              </div>
            </div>
            <div>
              <div className="h">built for 2 a.m.</div>
              <div className="p">
                she can tell a factual question from a scared one — and answers
                the one you’re actually asking.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* the 2am promise + founder */}
      <section className="landing-section landing-promise2">
        <div className="landing-container landing-promise2-grid">
          <div>
            <span className="landing-eyebrow landing-mono">the 2am promise</span>
            <h2 className="landing-title">
              never ads. never data sales. never judgment.
            </h2>
            <p className="landing-lede">
              2am exists for the questions you can’t ask anyone else — so the
              deal has no exceptions. your most vulnerable moment will never be
              monetized.
            </p>
          </div>
          <div className="landing-founder">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/founder-ali.png"
              alt="ali miller"
              className="landing-founder-photo"
            />
            <div>
              <div className="landing-founder-name">built by ali miller</div>
              <p className="landing-founder-blurb">
                one person — not a health-tech conglomerate. 2am exists because
                the 2 a.m. spiral is real, and the options weren’t good enough.
              </p>
              <Link href="/about" className="landing-founder-link landing-mono">
                the full story →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* faq */}
      <section className="landing-section landing-faq">
        <div className="landing-container">
          <span className="landing-eyebrow landing-mono">
            questions about 2am
          </span>
          <h2 className="landing-title">
            what people ask before they meet myla.
          </h2>
          <div className="landing-faq-list">
            <details className="landing-faq-item">
              <summary>is 2am free?</summary>
              <div className="landing-faq-answer">
                yes — right now everything in 2am is free: the app, myla, all of
                it. as 2am grows, a paid tier may come for extras. whatever
                happens, you’ll hear it from us first — no surprise paywalls at
                2 a.m.
              </div>
            </details>
            <details className="landing-faq-item">
              <summary>what happens to my chat history? is it private?</summary>
              <div className="landing-faq-answer">
                it’s yours. no ads, no data sales, nothing shared with insurers
                or advertisers — ever. and there’s a delete-my-account button in
                the app that permanently erases your account, profile, and every
                conversation. permanently means permanently.
              </div>
            </details>
            <details className="landing-faq-item">
              <summary>is myla a doctor? can she diagnose me?</summary>
              <div className="landing-faq-answer">
                no. myla is an ai friend, not a medical provider — she doesn’t
                diagnose or prescribe. she helps you figure out which questions
                are worth bringing to your doctor, and whether that’s a call
                tonight or a note for the morning.
              </div>
            </details>
            <details className="landing-faq-item">
              <summary>what if i’m in a mental health crisis at 2 a.m.?</summary>
              <div className="landing-faq-answer">
                myla is built to recognize when something is beyond her scope. if
                you mention thoughts of self-harm, severe postpartum symptoms, or
                a medical emergency, she’ll point you to a real human resource
                right there in the chat. she’s never a substitute for real help
                — she’s the friend who tells you to go get it.
              </div>
            </details>
            <details className="landing-faq-item">
              <summary>how do i start talking to myla?</summary>
              <div className="landing-faq-answer">
                she’s live now. “meet myla” opens a conversation in your browser,
                or download the 2am app from the app store.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* from the blog (SEO / internal links — kept off-mock) */}
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

      {/* closing cta */}
      <section className="landing-section landing-closing">
        <div className="landing-container">
          <span className="landing-eyebrow landing-mono">
            it’s 2 a.m. somewhere
          </span>
          <h2 className="landing-closing-h2">
            the night is long. you don’t have to sit with it alone.
          </h2>
          <div className="landing-closing-ctas">
            <Link className="landing-cta" href="/app/try">
              meet myla
            </Link>
            <AppStoreBadge />
          </div>
          <p className="landing-closing-trust landing-mono">
            free · no ads, ever · reviewed by a board-certified ob-gyn
          </p>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
