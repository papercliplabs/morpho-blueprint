import "server-only";

import { cache } from "react";
import type { Hex } from "viem";
import { pageSize } from "@/common/data/adapters/pagination";
import { executeMorphoQuery } from "@/common/utils/executeMorphoQuery";
import { APP_CONFIG, SUPPORTED_CHAIN_IDS } from "@/config";
import type { SupportedChainId } from "@/config/types";
import { Erc4626VaultProtocol } from "@/config/vault-protocol";
import { graphql } from "@/generated/gql/morpho";
import { matchVaultV2Adapter } from "./matchVaultV2Adapter";
import { ADAPTERS_PAGE_SIZE, CAPS_PAGE_SIZE } from "./pagination";

// The markets the app can show are whatever the configured vaults allocate to. For a vault V2 that
// means its MarketV1 caps plus whatever its adapters hold: a vault V1 through a MetaMorpho adapter,
// or another vault V2 through a MorphoVaultV2 adapter. The traversal lives here, in the vault
// module, because it is entirely a walk of vault config and vault allocation structure; the market
// module consumes the plain result (see `getSupportedMarketIds`).
//
// The query stays flat because the API multiplies a paginated field's cost by its `first` and
// multiplies again per nesting level. Walking `innerVault` inline blows the 1M complexity ceiling
// (~1.8M at `adapters(first: 20)` for the eight configured vaults, and it scales with that count),
// so an inner vault is resolved in a follow-up round instead. Selecting only its identity here
// costs 80 complexity points.
const vaultV2Query = graphql(`
  query SupportedMarketIdsVaultV2s(
    $chainIds: [Int!]!
    $addresses: [String!]!
    $first: Int!
    $capsFirst: Int!
    $capsSkip: Int!
    $adaptersFirst: Int!
    $adaptersSkip: Int!
  ) {
    vaultV2s(first: $first, where: { chainId_in: $chainIds, address_in: $addresses }) {
      items {
        chain {
          id
        }
        caps(first: $capsFirst, skip: $capsSkip) {
          pageInfo {
            countTotal
          }
          items {
            type
            data {
              __typename
              ... on MarketV1CapData {
                market {
                  marketId
                }
              }
            }
          }
        }
        adapters(first: $adaptersFirst, skip: $adaptersSkip) {
          pageInfo {
            countTotal
          }
          items {
            __typename
            ... on MetaMorphoAdapter {
              metaMorpho {
                state {
                  allocation {
                    market {
                      marketId
                    }
                  }
                }
              }
            }
            ... on MorphoVaultV2Adapter {
              innerVault {
                address
                chain {
                  id
                }
              }
            }
          }
        }
      }
    }
  }
`);

const vaultV1Query = graphql(`
  query SupportedMarketIdsVaultV1s($chainIds: [Int!]!, $addresses: [String!]!, $first: Int!) {
    vaults(first: $first, where: { chainId_in: $chainIds, address_in: $addresses }) {
      items {
        chain {
          id
        }
        state {
          allocation {
            market {
              marketId
            }
          }
        }
      }
    }
  }
`);

// Pages are sized by the vault V2 nested-collection constants, but unlike every other read this one
// drains past them with `skip`: a market missed here is missing from the whole app, not just from
// one table.

// The API rejects a `skip` above this, which also bounds the drain loop.
const MAX_SKIP = 10_000;

// A vault V2 adapter can wrap another vault V2, which can wrap another. Each level costs a round
// trip, so the walk is bounded; nothing in production nests at all today.
const MAX_ADAPTER_DEPTH = 3;

interface VaultRef {
  chainId: SupportedChainId;
  address: string;
}

type AddMarket = (chainId: SupportedChainId, marketId: Hex) => void;

const refKey = (ref: VaultRef) => `${ref.chainId}:${ref.address.toLowerCase()}`;

/**
 * `chainId_in` and `address_in` are independent filters, so one request covering several chains
 * matches their Cartesian product rather than the (chain, address) pairs asked for. Every request
 * below therefore covers exactly one chain, sized to that chain's addresses.
 */
function groupByChain(refs: VaultRef[]): [SupportedChainId, VaultRef[]][] {
  const byChain = new Map<SupportedChainId, VaultRef[]>();
  for (const ref of refs) {
    const group = byChain.get(ref.chainId) ?? [];
    group.push(ref);
    byChain.set(ref.chainId, group);
  }
  return Array.from(byChain.entries());
}

async function collectVaultV1Markets(refs: VaultRef[], add: AddMarket): Promise<void> {
  await Promise.all(
    groupByChain(refs).map(async ([chainId, group]) => {
      const response = await executeMorphoQuery(vaultV1Query, {
        chainIds: [chainId],
        addresses: group.map((ref) => ref.address),
        // Paginated-field cost scales with `first`, so request exactly what is configured.
        first: pageSize(group.length, "vault V1s"),
      });

      for (const vault of response.vaults.items ?? []) {
        for (const allocation of vault.state?.allocation ?? []) {
          add(vault.chain.id as SupportedChainId, allocation.market.marketId);
        }
      }
    }),
  );
}

async function collectVaultV2Markets(refs: VaultRef[], add: AddMarket, visited: Set<string>, depth = 0): Promise<void> {
  // Fan out per chain before anything else, so the drain loop below only ever sees one chain and its
  // `first` sizing is exact. Inner vaults reached through an adapter can sit on another chain, so
  // this re-splits on every level of the walk.
  const groups = groupByChain(refs);
  if (groups.length > 1) {
    await Promise.all(groups.map(([, group]) => collectVaultV2Markets(group, add, visited, depth)));
    return;
  }

  // A vault reached twice (a diamond, or a cycle through adapters) contributes nothing new.
  const pending = refs.filter((ref) => !visited.has(refKey(ref)));
  if (pending.length === 0) return;
  for (const ref of pending) visited.add(refKey(ref));

  const chainIds = Array.from(new Set(pending.map((ref) => ref.chainId)));
  const addresses = pending.map((ref) => ref.address);
  const first = pageSize(addresses.length, "vault V2s");
  const innerVaults: VaultRef[] = [];

  // The first round reads both collections. A vault wider than one page is rare, so any follow-up
  // round drains only the collection that is still short and asks for the cheapest page of the
  // other. `skip` applies across the whole result set, so a short vault simply returns nothing.
  let capsSkip = 0;
  let adaptersSkip = 0;
  let capsDone = false;
  let adaptersDone = false;

  while (!capsDone || !adaptersDone) {
    const capsFirst = capsDone ? 1 : CAPS_PAGE_SIZE;
    const adaptersFirst = adaptersDone ? 1 : ADAPTERS_PAGE_SIZE;

    const response = await executeMorphoQuery(vaultV2Query, {
      chainIds,
      addresses,
      first,
      capsFirst,
      capsSkip,
      adaptersFirst,
      adaptersSkip,
    });

    let capsTotal = 0;
    let adaptersTotal = 0;

    for (const vault of response.vaultV2s.items ?? []) {
      const chainId = vault.chain.id as SupportedChainId;

      if (!capsDone) {
        capsTotal = Math.max(capsTotal, vault.caps.pageInfo?.countTotal ?? 0);
        for (const cap of vault.caps.items ?? []) {
          // `caps` takes no type argument, so the MarketV1 filter is client-side.
          if (cap.type !== "MarketV1" || cap.data?.__typename !== "MarketV1CapData" || !cap.data.market) continue;
          add(chainId, cap.data.market.marketId);
        }
      }

      if (!adaptersDone) {
        adaptersTotal = Math.max(adaptersTotal, vault.adapters.pageInfo?.countTotal ?? 0);
        for (const adapter of vault.adapters.items ?? []) {
          matchVaultV2Adapter(adapter, {
            metaMorpho: (metaMorpho) => {
              for (const allocation of metaMorpho.metaMorpho.state?.allocation ?? []) {
                add(chainId, allocation.market.marketId);
              }
            },
            // A MorphoMarketV1Adapter needs no handling: its market is already a MarketV1 cap.
            marketV1: () => {},
            vaultV2: (vaultV2) => {
              const innerChainId = vaultV2.innerVault.chain.id;
              // An inner vault on a chain the app is not configured for would push markets the app
              // cannot transact on into the whitelist; skip it rather than trusting the cast.
              if (!(SUPPORTED_CHAIN_IDS as readonly number[]).includes(innerChainId)) {
                console.warn(`Skipping inner vault ${vaultV2.innerVault.address} on unsupported chain ${innerChainId}`);
                return;
              }
              innerVaults.push({
                chainId: innerChainId as SupportedChainId,
                address: vaultV2.innerVault.address,
              });
            },
            // Skipped, as it was before this walk routed through `matchVaultV2Adapter`. Its markets
            // are missing from the whitelist until the app learns the new adapter, which narrows the
            // borrow table — the alternative, throwing, would take down every page that reads it.
            unknown: () => {},
          });
        }
      }
    }

    if (!capsDone) {
      capsSkip += capsFirst;
      capsDone = capsSkip >= Math.min(capsTotal, MAX_SKIP);
    }
    if (!adaptersDone) {
      adaptersSkip += adaptersFirst;
      adaptersDone = adaptersSkip >= Math.min(adaptersTotal, MAX_SKIP);
    }
  }

  if (innerVaults.length === 0) return;

  if (depth + 1 >= MAX_ADAPTER_DEPTH) {
    console.warn(`Vault V2 adapters nest deeper than ${MAX_ADAPTER_DEPTH} levels; the innermost markets are dropped.`);
    return;
  }

  await collectVaultV2Markets(innerVaults, add, visited, depth + 1);
}

/** Every market the configured vaults allocate to, keyed by chain. Uncached; see callers. */
export const getVaultMarketIds = cache(async (): Promise<Record<SupportedChainId, Hex[]>> => {
  const configuredVaults = Object.entries(APP_CONFIG.supportedVaults).flatMap(([chainId, vaults]) =>
    vaults.map((vault) => ({ chainId: Number.parseInt(chainId) as SupportedChainId, ...vault })),
  );

  const v2Refs = configuredVaults.filter((vault) => vault.protocol === Erc4626VaultProtocol.MorphoV2);
  const v1Refs = configuredVaults.filter((vault) => vault.protocol === Erc4626VaultProtocol.MorphoV1);

  const marketWhitelist = {} as Record<SupportedChainId, Set<Hex>>;
  const add: AddMarket = (chainId, marketId) => {
    (marketWhitelist[chainId] ??= new Set()).add(marketId);
  };

  await Promise.all([
    v2Refs.length > 0 ? collectVaultV2Markets(v2Refs, add, new Set()) : undefined,
    v1Refs.length > 0 ? collectVaultV1Markets(v1Refs, add) : undefined,
  ]);

  const result = {} as Record<SupportedChainId, Hex[]>;
  for (const [chainId, marketIds] of Object.entries(marketWhitelist)) {
    result[Number(chainId) as SupportedChainId] = Array.from(marketIds);
  }

  return result;
});
