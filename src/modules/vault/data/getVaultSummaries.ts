import "server-only";

import { cache } from "react";
import { getAddress } from "viem";
import { pageSize, warnIfTruncated } from "@/common/data/adapters/pagination";
import { executeMorphoQuery } from "@/common/utils/executeMorphoQuery";
import { apyLookbackPeriod } from "@/common/utils/timeframe";
import { APP_CONFIG } from "@/config";
import type { SupportedChainId } from "@/config/types";
import { Erc4626VaultProtocol } from "@/config/vault-protocol";
import { graphql } from "@/generated/gql/morpho";
import { normalizeVault } from "@/modules/vault/utils/normalizeVault";
import type { VaultSummary } from "@/modules/vault/vault.types";
import { toMorphoVaultV1Summary, toMorphoVaultV2Summary } from "./adapters";
import { SUMMARY_ADAPTERS_PAGE_SIZE } from "./pagination";

// Whisk batched every vault into one keyed query; Morpho serves V1 and V2 vaults from separate
// root fields, so the configured vaults are split by protocol and the responses merged back.
//
// `first` is passed as a variable sized to the number of addresses requested, not a fixed page
// size: the API multiplies a paginated field's cost by `first`, so an oversized page blows the
// query-complexity cap even when only a handful of vaults match.
const vaultV2SummariesQuery = graphql(`
  query VaultV2Summaries(
    $first: Int!
    $chainIds: [Int!]!
    $addresses: [String!]!
    $lookbackV2: VaultV2LookbackPeriod!
    $adaptersFirst: Int!
  ) {
    vaultV2s(first: $first, where: { chainId_in: $chainIds, address_in: $addresses }) {
      pageInfo {
        count
        countTotal
      }
      items {
        ...MorphoVaultV2SummaryFragment
        ...MorphoVaultV2CollateralFragment
      }
    }
  }
`);

const vaultV1SummariesQuery = graphql(`
  query VaultV1Summaries($first: Int!, $chainIds: [Int!]!, $addresses: [String!]!, $lookbackV1: VaultV1LookbackPeriod!) {
    vaults(first: $first, where: { chainId_in: $chainIds, address_in: $addresses }) {
      pageInfo {
        count
        countTotal
      }
      items {
        ...MorphoVaultV1SummaryFragment
        ...MorphoVaultV1CollateralFragment
      }
    }
  }
`);

function vaultKey(chainId: number, address: string) {
  return `${chainId}:${getAddress(address)}`;
}

export type { VaultSummary };

export const getVaultSummaries = cache(async (): Promise<VaultSummary[]> => {
  const configuredVaults = Object.entries(APP_CONFIG.supportedVaults).flatMap(([chainId, vaults]) =>
    vaults.map((vault) => ({ chainId: Number.parseInt(chainId) as SupportedChainId, ...vault })),
  );

  // One request per chain per protocol, rather than one `chainId_in` x `address_in` request across
  // all of them. Those two filters are independent, so a combined request matches their Cartesian
  // product: an address that also resolves on another configured chain comes back as an extra item,
  // consumes a slot in a page sized to the configured address count, and pushes a genuinely
  // configured vault out of the response — where it would surface only as the "not returned by the
  // API" warning below. Single-chain deployments issue exactly the same number of requests as before.
  const byChain = new Map<SupportedChainId, { v2: string[]; v1: string[] }>();
  for (const vault of configuredVaults) {
    const entry = byChain.get(vault.chainId) ?? { v2: [], v1: [] };
    if (vault.protocol === Erc4626VaultProtocol.MorphoV2) entry.v2.push(vault.address);
    else entry.v1.push(vault.address);
    byChain.set(vault.chainId, entry);
  }
  const chains = Array.from(byChain.entries());

  const [v2Responses, v1Responses] = await Promise.all([
    Promise.all(
      chains.map(([chainId, { v2 }]) =>
        v2.length > 0
          ? executeMorphoQuery(vaultV2SummariesQuery, {
              first: pageSize(v2.length, "vault V2s"),
              chainIds: [chainId],
              addresses: v2,
              lookbackV2: apyLookbackPeriod,
              adaptersFirst: SUMMARY_ADAPTERS_PAGE_SIZE,
            })
          : null,
      ),
    ),
    Promise.all(
      chains.map(([chainId, { v1 }]) =>
        v1.length > 0
          ? executeMorphoQuery(vaultV1SummariesQuery, {
              first: pageSize(v1.length, "vault V1s"),
              chainIds: [chainId],
              addresses: v1,
              lookbackV1: apyLookbackPeriod,
            })
          : null,
      ),
    ),
  ]);

  const byKey = new Map<string, VaultSummary>();

  for (const response of v2Responses) {
    warnIfTruncated("vault V2s", response?.vaultV2s.pageInfo);
    for (const vault of response?.vaultV2s.items ?? []) {
      byKey.set(vaultKey(vault.chain.id, vault.address), normalizeVault(toMorphoVaultV2Summary(vault)));
    }
  }
  for (const response of v1Responses) {
    warnIfTruncated("vault V1s", response?.vaults.pageInfo);
    for (const vault of response?.vaults.items ?? []) {
      byKey.set(vaultKey(vault.chain.id, vault.address), normalizeVault(toMorphoVaultV1Summary(vault)));
    }
  }

  // Iterate the config rather than the responses so the order is deterministic and a vault the API
  // does not know about is reported rather than silently dropped.
  return configuredVaults.flatMap((configured) => {
    const vault = byKey.get(vaultKey(configured.chainId, configured.address));
    if (!vault) {
      console.warn(`Vault not returned by the API: ${configured.chainId}:${configured.address}`);
      return [];
    }
    return [vault];
  });
});
