import type { MetadataRoute } from "next";

import { APP_CONFIG } from "@/config";
import { getWhitelistedMarketIds } from "@/data/whisk/getWhitelistedMarketIds";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const whitelistedMarketIds = await getWhitelistedMarketIds();

  const vaultPages = Object.entries(APP_CONFIG.whitelistedVaults).flatMap(([chainId, addresses]) => {
    return addresses.map((address) => ({
      url: `${APP_CONFIG.appMetadata.url}/earn/${chainId}/${address}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    }));
  }) as MetadataRoute.Sitemap;

  const marketPages = Object.entries(whitelistedMarketIds).flatMap(([chainId, marketIds]) => {
    return Array.from(marketIds).map((id) => ({
      url: `${APP_CONFIG.appMetadata.url}/borrow/${chainId}/${id}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  }) as MetadataRoute.Sitemap;

  return [
    {
      url: `${APP_CONFIG.appMetadata.url}/earn`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${APP_CONFIG.appMetadata.url}/borrow`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...vaultPages,
    ...marketPages,
  ];
}
