import "server-only";

import type { Address, Hex } from "viem";

import { APP_CONFIG } from "@/config";
import type { SupportedChainId } from "@/config/types";
import { graphql } from "@/generated/gql/whisk";
import type { VaultPositionsQuery } from "@/generated/gql/whisk/graphql";
import { executeWhiskQuery } from "./execute";

const query = graphql(`
  query VaultPositions($keys: [Erc4626VaultPositionKey!]!) {
    erc4626VaultPositions(where: {
      keys: $keys
    },
    limit: 250) {
      items {
        vault {
          chain {
            id
          }
          asset {
            priceUsd
          }
          vaultAddress
        }

        assets {
          raw
          formatted
          usd
        }

        walletAssetHolding {
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

type VaultPositionQueryItem = NonNullable<VaultPositionsQuery["erc4626VaultPositions"]["items"][number]>;

export type VaultPosition = Exclude<VaultPositionQueryItem, "vault"> & {
  vault: Exclude<VaultPositionQueryItem["vault"], "chain"> & {
    chain: Exclude<VaultPositionQueryItem["vault"]["chain"], "id"> & { id: SupportedChainId };
  };
};
export type VaultPositionMap = Record<SupportedChainId, Record<Hex, VaultPosition>>; // ChainId -> VaultAddress -> VaultPosition

export const getVaultPositions = async (accountAddress: Address): Promise<VaultPositionMap> => {
  const keys = Object.entries(APP_CONFIG.supportedVaults).flatMap(([chainId, vaults]) =>
    vaults.map((vault) => ({
      chainId: Number.parseInt(chainId) as SupportedChainId,
      vaultAddress: vault.address,
      protocol: vault.protocol,
      accountAddress,
    })),
  );

  const response = await executeWhiskQuery(query, { keys });

  const data: VaultPositionMap = {} as VaultPositionMap;
  for (const position of response.erc4626VaultPositions.items) {
    if (!position) {
      // Ignore, will already be logged at execute layer
      continue;
    }

    const chainId = position.vault.chain.id as SupportedChainId;
    const vaultAddress = position.vault.vaultAddress;

    if (!data[chainId]) {
      data[chainId] = {};
    }
    data[chainId][vaultAddress] = { ...position, vault: { ...position.vault, chain: { id: chainId } } };
  }

  return data;
};
