import type { Metadata } from "next";
import Link from "next/link";
import "../legal.css";

export const metadata: Metadata = {
  title: "dmca copyright policy — 2am",
  description:
    "the dmca copyright policy for 2am — how to submit a takedown notice, how we respond, and how to reach our designated agent.",
};

export default function DmcaPage() {
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

        <h1 className="legal-title">dmca copyright policy</h1>
        <p className="legal-meta">last updated: june 2026</p>

        <section className="legal-section">
          <p>
            <span className="brand-name">2am</span> is operated by AAA
            Incubator, LLC. we respect the intellectual property rights of
            others and respond to valid notices of alleged copyright
            infringement in accordance with the Digital Millennium Copyright Act
            (17 U.S.C. § 512).
          </p>
        </section>

        <section className="legal-section">
          <h2>filing a takedown notice</h2>
          <p>
            if you believe content on hey2am.app infringes your copyright, send
            a written notice to our designated agent (below) that includes:
          </p>
          <ul>
            <li>your physical or electronic signature;</li>
            <li>
              identification of the copyrighted work claimed to be infringed;
            </li>
            <li>
              identification of the allegedly infringing material and
              information reasonably sufficient to let us locate it (e.g., a
              url);
            </li>
            <li>your contact information (name, address, phone, email);</li>
            <li>
              a statement that you have a good-faith belief the use is not
              authorized by the copyright owner, its agent, or the law; and
            </li>
            <li>
              a statement, under penalty of perjury, that the information in
              your notice is accurate and that you are the copyright owner or
              authorized to act on its behalf.
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>our response</h2>
          <p>
            upon receiving a valid notice, we will remove or disable access to
            the material and make a reasonable effort to notify the user who
            posted it.
          </p>
        </section>

        <section className="legal-section">
          <h2>counter-notification</h2>
          <p>
            if your content was removed and you believe it was a mistake or
            misidentification, you may send our designated agent a counter-notice
            containing:
          </p>
          <ul>
            <li>your signature;</li>
            <li>
              identification of the removed material and its prior location;
            </li>
            <li>
              a statement under penalty of perjury that you have a good-faith
              belief the material was removed by mistake or misidentification;
            </li>
            <li>your name, address, and phone number; and</li>
            <li>
              a statement that you consent to the jurisdiction of the federal
              court for your district (or, if outside the u.s., any district in
              which we may be found) and will accept service of process from the
              complainant.
            </li>
          </ul>
          <p>
            we may restore the material in 10–14 business days unless the
            complainant files a court action.
          </p>
        </section>

        <section className="legal-section">
          <h2>repeat infringers</h2>
          <p>
            we will, in appropriate circumstances, terminate the accounts of
            users who are repeat infringers.
          </p>
        </section>

        <section className="legal-section">
          <h2>designated agent</h2>
          <div
            style={{
              marginTop: 8,
              padding: 24,
              borderRadius: 20,
              background: "rgba(22, 34, 54, 0.6)",
              border: "1px solid rgba(248, 200, 168, 0.3)",
              fontSize: 15,
              lineHeight: 1.8,
              color: "rgba(255, 250, 245, 0.85)",
            }}
          >
            <strong style={{ color: "var(--cream)" }}>DMCA Agent</strong>
            <br />
            AAA Incubator, LLC
            <br />
            616 Desoto Ave, Lehigh Acres, FL 33972
            <br />
            Email:{" "}
            <a href="mailto:dmca@aaa-incubator.com">dmca@aaa-incubator.com</a>
            <br />
            U.S. Copyright Office Registration No. DMCA-1074596
          </div>
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
