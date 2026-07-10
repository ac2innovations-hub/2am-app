import Link from "next/link";
import AppStoreBadge from "@/components/AppStoreBadge";

// Shared marketing footer. Markup identical to the landing's original inline
// footer; styled by landing.css (.landing-footer*), so any page rendering this
// must import landing.css.
export default function SiteFooter() {
  return (
    <footer className="landing-footer">
      <Link href="/" className="landing-footer-brand" aria-label="2am — home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/wordmark.svg" alt="2am" className="landing-footer-wordmark" />
      </Link>
      <p className="landing-footer-signoff">
        <span className="brand-name">2am</span> — myla’s always up.
      </p>
      <span className="landing-mono">hey2am.app</span>
      <AppStoreBadge className="landing-appstore-footer" />
      <div style={{ marginTop: 16 }}>
        © 2026 <span className="brand-name">2am</span>. myla is an ai friend, not a medical provider.
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
        {" · "}
        <Link href="/dmca" className="landing-footer-link">
          dmca
        </Link>
        {" · "}
        <a
          href="https://www.instagram.com/hey2amapp"
          target="_blank"
          rel="noopener noreferrer"
          className="landing-footer-link"
        >
          instagram
        </a>
        {" · "}
        <a
          href="https://www.tiktok.com/@hey2am.app"
          target="_blank"
          rel="noopener noreferrer"
          className="landing-footer-link"
        >
          tiktok
        </a>
      </div>
    </footer>
  );
}
