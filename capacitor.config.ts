import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.hey2am.ios",
  appName: "2AM",
  // www/index.html is the branded splash that ships in the bundle.
  // Capacitor loads server.url directly into the WebView. We point at
  // the *post-redirect* host: hey2am.app/app 307-redirects to
  // www.hey2am.app/app, and Capacitor treats the new host as external
  // navigation and kicks out to Safari (the App Store rejection). Using
  // the resolved www URL means there's no cross-host redirect at launch.
  webDir: "www",
  server: {
    url: "https://www.hey2am.app/app",
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
