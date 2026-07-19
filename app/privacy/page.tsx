import type { Metadata } from "next";
import Link from "next/link";
import "../legal.css";

export const metadata: Metadata = {
  title: "privacy policy — 2am",
  description:
    "how 2am collects, uses, and protects your data. we collect only what we need, never sell your information, and your conversations are yours.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <div className="legal-container">
        <Link href="/" className="legal-back">
          ← back to home
        </Link>
        <Link href="/" className="legal-logo" aria-label="2am — home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/wordmark.svg" alt="2am" className="legal-logo-img" />
        </Link>

        <h1 className="legal-title">privacy policy</h1>
        <p className="legal-meta">last updated: july 2026</p>

        <section className="legal-section">
          <h2>the short version</h2>
          <ul>
            <li>we collect only what we need to make myla work for you.</li>
            <li>we never sell your data. to anyone. for any reason.</li>
            <li>
              your conversations with myla are yours. you can delete them
              anytime.
            </li>
            <li>
              we use anthropic&apos;s ai to power myla. your messages are sent
              to their api to generate responses.
            </li>
            <li>
              we don&apos;t serve ads. we don&apos;t let advertisers access
              your data.
            </li>
            <li>
              you can request all your data or delete your account at any
              time.
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>what we collect</h2>

          <h3>information you give us</h3>
          <ul>
            <li>
              <strong>email address</strong> — when you join the waitlist or
              create an account.
            </li>
            <li>
              <strong>name</strong> — when you tell myla your name during
              onboarding.
            </li>
            <li>
              <strong>pregnancy/journey details</strong> — your stage (trying
              to conceive, pregnant, or postpartum), due date, how long
              you&apos;ve been trying, baby&apos;s age, and similar details
              you share with myla. you choose what to share.
            </li>
            <li>
              <strong>conversation content</strong> — the messages you send to
              myla and her responses.
            </li>
            <li>
              <strong>mood logs</strong> — if you use the mood tracking
              feature.
            </li>
          </ul>

          <h3>information we collect automatically</h3>
          <ul>
            <li>
              <strong>basic usage data</strong> — pages visited, features
              used, session duration. we use this to improve the product, not
              to profile you.
            </li>
            <li>
              <strong>device information</strong> — browser type, operating
              system, screen size. used for fixing bugs and ensuring the app
              works on your device.
            </li>
            <li>
              <strong>cookies</strong> — we use essential cookies (to keep you
              signed in and remember preferences) and one privacy-respecting
              analytics cookie (posthog) that measures how the app is used —
              without recording your session, selling your data, or tracking
              you across other sites. we don&apos;t use advertising cookies.
            </li>
            <li>
              <strong>a safety signal</strong> — if a conversation suggests you
              may be going through a crisis, <span className="brand-name">2am</span>{" "}
              records the time this happened (not the content) so myla can
              respond with care and avoid sending an upbeat nudge at the wrong
              moment. it&apos;s a private flag on your account, never shared.
            </li>
          </ul>

          <h3>information we do NOT collect</h3>
          <ul>
            <li>precise location data</li>
            <li>contacts or address book</li>
            <li>photos or camera access</li>
            <li>health records or medical data from other apps</li>
            <li>biometric data</li>
            <li>
              financial information (until you subscribe, and then only
              through our payment processor)
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>how we use your information</h2>
          <ul>
            <li>
              <strong>to power myla&apos;s responses</strong> — your
              conversation messages are sent to anthropic&apos;s claude api to
              generate myla&apos;s replies. under anthropic&apos;s api terms,
              your data is not used to train their models.
            </li>
            <li>
              <strong>to personalize your experience</strong> — myla remembers
              your name, your stage, your concerns, and your preferences so
              she can be a better friend.
            </li>
            <li>
              <strong>to improve the product</strong> — we analyze aggregated,
              anonymized usage patterns to understand what features are most
              helpful. we never read individual conversations for marketing
              purposes.
            </li>
            <li>
              <strong>to communicate with you</strong> — waitlist updates,
              product launches, and important account notifications. you can
              unsubscribe from non-essential emails anytime.
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>third-party ai service</h2>
          <p>
            myla&apos;s responses are powered by anthropic&apos;s claude ai.
            when you send a message to myla, your conversation content —
            including your name, your stage, and anything you share — is sent
            to anthropic&apos;s api to generate a response.
          </p>
          <p>
            anthropic does not use your conversations to train their ai models,
            and retains api data only for a limited period under their
            commercial terms. for details, see{" "}
            <a
              href="https://www.anthropic.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              anthropic&apos;s privacy policy
            </a>
            .
          </p>
          <p>
            beyond anthropic, <span className="brand-name">2am</span> relies on
            a small set of service providers to run the app (below). each
            processes only what it needs to do its job, and none receive your
            data to use for their own purposes. we never sell your data.
          </p>
        </section>

        <section className="legal-section">
          <h2>who we share your data with</h2>
          <p>service providers we use:</p>
          <ul>
            <li>
              <strong>anthropic</strong> — powers myla&apos;s responses
              (receives your messages)
            </li>
            <li>
              <strong>supabase</strong> — database + accounts (stores your
              profile and conversations)
            </li>
            <li>
              <strong>vercel</strong> — hosting (serves the app)
            </li>
            <li>
              <strong>upstash</strong> — rate limiting to prevent abuse (an
              anonymized id only; no message content)
            </li>
            <li>
              <strong>posthog</strong> — privacy-respecting product analytics
              (usage counts + an anonymized id; no message content, no session
              recording, respects do-not-track)
            </li>
            <li>
              <strong>apple push (apns)</strong> — delivers notifications you
              opt into (a device token only)
            </li>
            <li>
              <strong>formspree / resend</strong> — contact form and
              transactional email
            </li>
          </ul>
          <p>
            we never share data with advertisers, data brokers, social media
            platforms, or employers/insurers/government agencies (unless
            legally compelled).
          </p>
          <p>
            joining the waitlist is separate from creating an account. waitlist
            emails are held by formspree and delivered through resend; deleting
            your in-app account removes your account data but does not remove
            waitlist records held by these providers — email{" "}
            <a href="mailto:privacy@hey2am.app">privacy@hey2am.app</a> to have
            those removed.
          </p>
        </section>

        <section className="legal-section">
          <h2>data security</h2>
          <ul>
            <li>
              your conversations are encrypted in transit and encrypted at rest
              by our database provider. (they are not end-to-end encrypted —
              the service providers above process them to run the app.)
            </li>
            <li>passwords are hashed and never stored in plain text.</li>
            <li>
              database access is restricted and protected by row-level
              security.
            </li>
            <li>
              no system is 100% secure. we do our best, but we can&apos;t
              guarantee absolute security.
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>your rights</h2>
          <ul>
            <li>
              <strong>access your data</strong> — request a copy of everything
              we have about you.
            </li>
            <li>
              <strong>correct your data</strong> — update your profile
              information anytime in the app.
            </li>
            <li>
              <strong>delete your data</strong> — delete individual
              conversations or your entire account. when you delete your
              account, we remove your profile and conversations from our
              servers right away, and clear them from your device. anthropic
              deletes any related api data within about 30 days on their side.
            </li>
            <li>
              <strong>opt out of emails</strong> — unsubscribe from marketing
              emails anytime.
            </li>
            <li>
              <strong>export your data</strong> — request a portable copy of
              your conversations and profile.
            </li>
          </ul>
          <p>
            to exercise any of these rights, email us at{" "}
            <a href="mailto:privacy@hey2am.app">privacy@hey2am.app</a>.
          </p>
        </section>

        <section className="legal-section">
          <h2>an important note about ai</h2>
          <p>
            myla is powered by artificial intelligence (anthropic&apos;s
            claude). myla&apos;s responses are generated by ai, not written by
            a human. myla is not a doctor, therapist, or medical professional.
            while we work hard to ensure myla&apos;s responses are accurate,
            ai can make mistakes. always verify important health information
            with your healthcare provider.
          </p>
        </section>

        <section className="legal-section">
          <h2>children&apos;s privacy</h2>
          <p>
            <span className="brand-name">2am</span> is designed for adults. we do not knowingly collect
            information from anyone under 13. if we learn we&apos;ve collected
            data from a child, we will delete it immediately.
          </p>
        </section>

        <section className="legal-section">
          <h2>changes to this policy</h2>
          <p>
            we may update this policy from time to time. if we make
            significant changes, we&apos;ll notify you via email or in-app
            notification.
          </p>
        </section>

        <section className="legal-section">
          <h2>contact us</h2>
          <p>
            email: <a href="mailto:privacy@hey2am.app">privacy@hey2am.app</a>
            <br />
            website: hey2am.app
          </p>
        </section>

        <footer className="legal-footer">
          <Link href="/" className="legal-footer-brand" aria-label="2am — home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/wordmark.svg" alt="2am" className="legal-footer-wordmark" />
          </Link>
          © 2026 <span className="brand-name">2am</span>. built with care in florida.
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
