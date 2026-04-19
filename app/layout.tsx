import type { Metadata, Viewport } from "next";
import { DM_Mono, Outfit } from "next/font/google";
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
    "the judgment-free ai companion for pregnancy & motherhood. no judgment. no google history. just answers.",
  metadataBase: new URL("https://hey2am.app"),
  openGraph: {
    title: "2am — myla's always up",
    description:
      "the judgment-free ai companion for pregnancy & motherhood.",
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${dmMono.variable}`}>
      <body className="min-h-svh bg-midnight text-cream antialiased">
        <div className="mx-auto min-h-svh w-full max-w-md bg-midnight">
          {children}
        </div>
      </body>
    </html>
  );
}
