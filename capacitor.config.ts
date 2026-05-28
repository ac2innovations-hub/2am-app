import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.hey2am.ios",
  appName: "2AM",
  // www/index.html is the branded splash that ships in the bundle.
  // Capacitor loads server.url directly into the WebView. We point at
  // the landing page (www host, no path) so the marketing landing page
  // is the first thing users see; they tap "meet myla" to enter /app.
  // Note the www host: hey2am.app 307-redirects to www.hey2am.app, and
  // a cross-host redirect at launch gets kicked out to Safari (the App
  // Store rejection), so we use the already-resolved www host directly.
  webDir: "www",
  server: {
    url: "https://www.hey2am.app",
    cleartext: false,
    // Keep both apex and www (and any subdomain) inside the WebView, so
    // any future cross-host link/redirect is handled in-app rather than
    // handed off to Safari. The native guard in AppDelegate.swift is a
    // second layer on top of this.
    allowNavigation: ["hey2am.app", "www.hey2am.app", "*.hey2am.app"],
  },
  ios: {
    contentInset: "always",
  },
};

export default config;
