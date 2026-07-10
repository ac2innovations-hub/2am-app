import Link from "next/link";

// Shared marketing top nav (wordmark + about/blog). Markup is identical to the
// landing's original inline nav; styled by landing.css
// (.landing-header/.landing-navbrand/.landing-topnav), so any page rendering
// this must import landing.css.
export default function SiteNav() {
  return (
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
  );
}
