import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.hey2am.ios",
  appName: "2AM",
  // Placeholder shell only — see www/index.html. This project has API
  // routes + middleware so it can't use Next static export; the native
  // app loads the live deployed site instead (server.url below).
  webDir: "www",
  server: {
    // Load the live web app directly. Content updates ship through the
    // normal Vercel deploy — no rebuild or App Store resubmission needed
    // for web changes. /app is the authenticated product entry point.
    url: "https://hey2am.app/app",
    cleartext: false,
  },
  ios: {
    contentInset: "always",
  },
};

export default config;
