import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.hey2am.ios",
  appName: "2AM",
  // The native shell loads www/index.html, which shows the branded
  // loading screen and then JS-redirects to https://hey2am.app/app.
  // This guarantees the branded screen is always painted first — no
  // white-screen window while the network request is in flight.
  webDir: "www",
  ios: {
    contentInset: "always",
  },
};

export default config;
