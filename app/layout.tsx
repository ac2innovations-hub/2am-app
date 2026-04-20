import type { Metadata, Viewport } from "next";
import { DM_Mono, Outfit } from "next/font/google";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "2am — myla's always up",
  description:
    "the judgment-free ai companion for your journey — whether you're trying, expecting, or navigating life as a new mom. no judgment. no google history. just answers.",
  metadataBase: new URL("https://hey2am.app"),
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [
      { url: "/apple-touch-icon.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
  },
  appleWebApp: {
    title: "2AM",
    capable: true,
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "2am — myla's always up",
    description:
      "the judgment-free ai companion for your journey — whether you're trying, expecting, or navigating life as a new mom.",
    url: "https://hey2am.app",
    siteName: "2am",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0D1628",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

// iOS requires per-device startup images matched by media query. We point
// every size at the same SVG (SVG scales cleanly); older iOS devices that
// don't honor an unmatched splash simply fall back to the manifest
// background_color, which is #0D1628 — same midnight the splash uses.
const APPLE_SPLASH_SIZES = [
  // iPhone 14 Pro Max
  "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  // iPhone 14 Pro
  "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  // iPhone 14 / 13 / 12
  "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  // iPhone 14 Plus / 13 Pro Max / 12 Pro Max
  "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  // iPhone 13 mini / 12 mini / X / XS / 11 Pro
  "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  // iPhone 11 / XR
  "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
  // iPhone XS Max / 11 Pro Max
  "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  // iPhone 8 Plus / 7 Plus / 6s Plus
  "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  // iPhone 8 / 7 / 6s / SE (gen 2, 3)
  "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
  // iPhone SE (1st gen) / 5s
  "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${dmMono.variable}`}>
      <head>
        {APPLE_SPLASH_SIZES.map((media) => (
          <link
            key={media}
            rel="apple-touch-startup-image"
            media={media}
            href="/splash.svg"
          />
        ))}
      </head>
      <body className="min-h-svh bg-midnight text-cream antialiased">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
