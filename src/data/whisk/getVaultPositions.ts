import "server-only";

import type { Address, Hex } from "viem";

import { APP_CONFIG } from "@/config";
import type { SupportedChainId } from "@/config/types";
import { graphql } from "@/generated/gql/whisk";
import type { VaultPositionsQuery } from "@/generated/gql/whisk/graphql";
import type { ChainId } from "@/whisk-types";
import { executeWhiskQuery } from "./execute";

const query = graphql(`
  query VaultPositions($chainIds: [ChainId!]!, $vaultAddresses: [Address!]!, $accountAddress: Address!) {
    morphoVaultPositions(where: {
      chainId_in: $chainIds,
      vaultAddress_in: $vaultAddresses,
      accountAddress_in: [$accountAddress],
    },
    limit: 250) {
      items {
        vault {
          chain {
            id
          }
          vaultAddress
        }

        supplyAmount {
          raw
          formatted
          usd
        }

        walletUnderlyingAssetHolding {
          balance {
            raw
            formatted
            usd
          }
        }
      }
    }
  }
`);

export type VaultPosition = NonNullable<VaultPositionsQuery["morphoVaultPositions"]["items"][number]>;
export type VaultPositionMap = Record<SupportedChainId, Record<Hex, VaultPosition>>; // ChainId -> VaultAddress -> VaultPosition

export const getVaultPositions = async (accountAddress: Address): Promise<VaultPositionMap> => {
  const chainIds = Object.keys(APP_CONFIG.supportedVaults).map((chainId) => Number.parseInt(chainId) as ChainId);
  const vaultAddresses = Object.values(APP_CONFIG.supportedVaults)
    .flat()
    .map((v) => v.address);

  const response = await executeWhiskQuery(query, {
    chainIds,
    vaultAddresses,
    accountAddress,
  });

  const data: VaultPositionMap = {} as VaultPositionMap;
  for (const position of response.morphoVaultPositions.items) {
    if (!position) {
      // Ignore, will already be logged at execute layer
      continue;
    }

    // Filter out potential for wrong vault with same address on another chain
    if (
      !APP_CONFIG.supportedVaults[position.vault.chain.id as SupportedChainId].some(
        (v) => v.address === position.vault.vaultAddress,
      )
    ) {
      continue;
    }

    const chainId = position.vault.chain.id as SupportedChainId;
    const vaultAddress = position.vault.vaultAddress;

    if (!data[chainId]) {
      data[chainId] = {};
    }
    data[chainId][vaultAddress] = position;
  }

  return data;
};
