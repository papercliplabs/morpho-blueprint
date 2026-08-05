import { type Address, getAddress } from "viem";
import { toDecimals } from "@/common/data/adapters/amount";
import type { ChainInfo, CuratorInfo, TokenInfo } from "@/common/data/types";
import { capitalizeFirstLetter } from "@/common/utils/format";
import { APP_CONFIG } from "@/config";

/**
 * The GraphQL API exposes no chain icon, but the Morpho CDN hosts them under
 * `/assets/chains/<slug>.<ext>`, keyed by a short name rather than the chain id or `Chain.network`.
 * Most assets are `.svg`; a few (Base, World Chain) exist only as `.png`, so a slug may carry an
 * explicit extension and defaults to `.svg` without one.
 *
 * These are the slugs the CDN actually serves, each verified to return 200. Coverage is partial —
 * a chain with no asset gets a null `ChainInfo.icon` and render sites drop the badge rather than
 * showing a broken image.
 *
 * A deployment can override or extend this per chain via `chainConfig[id].iconSlug`, which is what
 * a chain outside this map needs. The defaults stay here so that adding a supported chain does not
 * silently lose an icon the CDN already has.
 */
const CHAIN_ICON_SLUG: Record<number, string> = {
  1: "eth",
  10: "optimism",
  130: "unichain",
  137: "polygon",
  480: "world.png",
  999: "hyperliquid",
  4663: "robinhood",
  5042: "arc",
  8453: "base.png",
  42161: "arbitrum",
  98866: "plume",
  747474: "katana",
};

export function getChainIconUrl(chainId: number): string | null {
  const chainConfig = APP_CONFIG.chainConfig as Record<number, { iconSlug?: string } | undefined>;
  const slug = chainConfig[chainId]?.iconSlug ?? CHAIN_ICON_SLUG[chainId];
  if (!slug) return null;
  const filename = slug.includes(".") ? slug : `${slug}.svg`;
  return `https://cdn.morpho.org/assets/chains/${filename}`;
}

interface RawAsset {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string | null;
  tags?: string[] | null;
}

export function toTokenInfo(asset: RawAsset): TokenInfo {
  return {
    address: getAddress(asset.address) as Address,
    symbol: asset.symbol,
    name: asset.name,
    decimals: toDecimals(asset.decimals),
    icon: asset.logoURI ?? null,
    // The app only groups by a single category; `tags` is an unordered list, so take the first.
    category: asset.tags?.[0] ?? null,
  };
}

export function toChainInfo(chain: { id: number; network: string }): ChainInfo {
  return {
    id: chain.id,
    name: capitalizeFirstLetter(chain.network),
    icon: getChainIconUrl(chain.id),
  };
}

interface RawCurator {
  name: string;
  image: string | null;
  socials: { type: string; url: string }[];
}

export function toCuratorInfo(curator: RawCurator | null | undefined): CuratorInfo | null {
  if (!curator) return null;
  // `Curator.url` has no direct equivalent: pick the website-type social, else the first one.
  const website = curator.socials.find((social) => social.type === "url") ?? curator.socials[0];
  return {
    name: curator.name,
    image: curator.image ?? null,
    url: website?.url ?? null,
  };
}
