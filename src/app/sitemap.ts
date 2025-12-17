import type { MetadataRoute } from "next";
import { getAddress } from "viem";

import { APP_CONFIG } from "@/config";
import { getSupportedMarketIds } from "@/modules/market/data/getSupportedMarketIds";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supportedMarketIds = await getSupportedMarketIds();

  const vaultPages = Object.entries(APP_CONFIG.supportedVaults).flatMap(([chainId, vaults]) => {
    return vaults.map((v) => ({
      url: `${APP_CONFIG.metadata.url}/earn/${chainId}/${getAddress(v.address)}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    }));
  }) as MetadataRoute.Sitemap;

  const marketPages = Object.entries(supportedMarketIds).flatMap(([chainId, marketIds]) => {
    return Array.from(marketIds).map((id) => ({
      url: `${APP_CONFIG.metadata.url}/borrow/${chainId}/${id}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  }) as MetadataRoute.Sitemap;

  return [
    {
      url: `${APP_CONFIG.metadata.url}/earn`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${APP_CONFIG.metadata.url}/borrow`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...vaultPages,
    ...marketPages,
  ];
}
