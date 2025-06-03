import type { MetadataRoute } from "next";

import { APP_CONFIG } from "../config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_CONFIG.appMetadata.name,
    short_name: APP_CONFIG.appMetadata.name,
    description: APP_CONFIG.appMetadata.description,
    start_url: "/",
    icons: [
      {
        src: APP_CONFIG.appMetadata.images.icons["png-192x192"],
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: APP_CONFIG.appMetadata.images.icons["png-512x512"],
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    display: "standalone",
  };
}
