import type { MetadataRoute } from "next";

const SITE = "https://www.hey2am.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The in-app UI is not indexable content (and is auth-gated). Keep it,
      // the API, and the auth callbacks out of the index.
      disallow: ["/app/", "/api/", "/auth/"],
    },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
