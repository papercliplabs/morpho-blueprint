import "server-only";

import { cache } from "react";
import type { Address } from "viem";
import type { SupportedChainId } from "@/config/types";
import { graphql } from "@/generated/gql/whisk";
import type { VaultQuery } from "@/generated/gql/whisk/graphql";
import { executeWhiskQuery } from "./execute";

const query = graphql(`
  query Vault($chainId: ChainId!, $vaultAddress: Address!) {
    morphoVaults(where: {chainId_in: [$chainId], vaultAddress_in: [$vaultAddress]}) {
      items {
        ...VaultSummaryFragment

        asset {
          priceUsd
        }

        totalSupplied {
          raw
          formatted
          usd
        }

        totalLiquidity {
          raw
          formatted
          usd
        }

        metadata {
          description
        }

        performanceFee
        feeRecipientAddress
        ownerAddress
        curatorAddress
        guardianAddress

        marketAllocations {
          market {
            marketId
            chain {
              ...ChainInfoFragment
            }
            isIdle
            name
            lltv {
              raw
              formatted
            }
            collateralAsset {
              ...TokenInfoFragment
            }
            loanAsset {
              ...TokenInfoFragment
            }
            supplyApy {
              ...ApyFragment
            }
          }
          enabled
          position {
            supplyAmount {
              raw
              formatted
              usd
            }
            supplyShares
          }
          supplyCap {
            raw
            formatted
            usd
          }
          vaultSupplyShare
        }

        historical {
            hourly {
              ...VaultHistoricalEntryFragment
            }
            daily {
              ...VaultHistoricalEntryFragment
            }
            weekly {
              ...VaultHistoricalEntryFragment
            }
          }
      }
    }
  }
`);

export type Vault = NonNullable<VaultQuery["morphoVaults"]["items"][number]>;

export const getVault = cache(async (chainId: SupportedChainId, vaultAddress: Address): Promise<Vault> => {
  const data = await executeWhiskQuery(query, {
    chainId,
    vaultAddress,
  });

  const vault = data.morphoVaults.items[0];

  if (!vault) {
    throw new Error(`Vault not found: ${chainId}:${vaultAddress}`);
  }

  return vault;
});
