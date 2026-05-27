import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.hey2am.ios",
  appName: "2AM",
  // www/index.html is the branded splash that ships in the bundle.
  // With server.url set, Capacitor loads the live site directly into
  // the WebView — keeping hey2am.app as the home origin means in-app
  // navigation stays inside the WebView and never escapes to Safari.
  webDir: "www",
  server: {
    url: "https://hey2am.app/app",
    cleartext: false,
  },
  ios: {
    contentInset: "always",
  },
};

export default config;
