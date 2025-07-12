import type { MetadataRoute } from "next";

import { APP_CONFIG } from "@/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/"],
      disallow: ["/api/"],
    },
    sitemap: [`${APP_CONFIG.metadata.url}/sitemap.xml`],
  };
}
