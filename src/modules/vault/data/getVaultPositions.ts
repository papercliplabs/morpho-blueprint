import "server-only";

import { type Address, getAddress } from "viem";
import { toAmount, toAmountWithPrice } from "@/common/data/adapters/amount";
import { pageSize } from "@/common/data/adapters/pagination";
import { getWalletTokenBalances } from "@/common/data/rpc/getWalletTokenBalances";
import { executeMorphoQuery } from "@/common/utils/executeMorphoQuery";
import { APP_CONFIG } from "@/config";
import type { SupportedChainId } from "@/config/types";
import { Erc4626VaultProtocol } from "@/config/vault-protocol";
import { graphql } from "@/generated/gql/morpho";
import type { VaultPosition, VaultPositionMap } from "@/modules/vault/vault.types";
import type { BigIntish } from "@/morpho-types";

// `userByAddress` is per chain and returns every position the account holds on it; the configured
// vaults are the filter. The vault lists ride along so a vault with no position still resolves its
// asset (and therefore its wallet balance), which is what the "In Wallet" column reads.
//
// Each vault list is skipped outright when the config has no vault of that protocol: the API treats
// an empty `address_in` as *no filter* rather than as "match nothing", so issuing the query anyway
// would page in an arbitrary unconfigured vault.
const query = graphql(`
  query VaultPositions(
    $chainId: Int!
    $accountAddress: String!
    $v2Addresses: [String!]!
    $v1Addresses: [String!]!
    $v2First: Int!
    $v1First: Int!
    $hasV2: Boolean!
    $hasV1: Boolean!
  ) {
    user: userByAddress(address: $accountAddress, chainId: $chainId) {
      vaultV2Positions {
        assets
        assetsUsd
        vault {
          address
        }
      }
      vaultPositions {
        state {
          assets
          assetsUsd
        }
        vault {
          address
        }
      }
    }
    vaultV2s(first: $v2First, where: { chainId_in: [$chainId], address_in: $v2Addresses }) @include(if: $hasV2) {
      items {
        address
        asset {
          address
          decimals
          price {
            usd
          }
        }
      }
    }
    vaults(first: $v1First, where: { chainId_in: [$chainId], address_in: $v1Addresses }) @include(if: $hasV1) {
      items {
        address
        asset {
          address
          decimals
          price {
            usd
          }
        }
      }
    }
  }
`);

export type { VaultPosition, VaultPositionMap };

export const getVaultPositions = async (accountAddress: Address): Promise<VaultPositionMap> => {
  const chainIds = Object.keys(APP_CONFIG.supportedVaults).map(
    (chainId) => Number.parseInt(chainId) as SupportedChainId,
  );

  const perChain = await Promise.all(
    chainIds.map(async (chainId) => [chainId, await getVaultPositionsForChain(chainId, accountAddress)] as const),
  );

  const data = {} as VaultPositionMap;
  for (const [chainId, positions] of perChain) {
    data[chainId] = positions;
  }
  return data;
};

async function getVaultPositionsForChain(chainId: SupportedChainId, accountAddress: Address) {
  const configuredVaults = APP_CONFIG.supportedVaults[chainId] ?? [];
  const v2Addresses = configuredVaults
    .filter((vault) => vault.protocol === Erc4626VaultProtocol.MorphoV2)
    .map((vault) => vault.address);
  const v1Addresses = configuredVaults
    .filter((vault) => vault.protocol === Erc4626VaultProtocol.MorphoV1)
    .map((vault) => vault.address);

  const response = await executeMorphoQuery(query, {
    chainId,
    accountAddress,
    v2Addresses,
    v1Addresses,
    // Paginated-field cost scales with `first`, so request exactly what is configured.
    v2First: pageSize(v2Addresses.length, "vault V2s"),
    v1First: pageSize(v1Addresses.length, "vault V1s"),
    hasV2: v2Addresses.length > 0,
    hasV1: v1Addresses.length > 0,
  });

  // vaultAddress -> asset
  const assetByVault = new Map<string, { address: Address; decimals: number; priceUsd: number | null }>();
  for (const vault of [...(response.vaultV2s?.items ?? []), ...(response.vaults?.items ?? [])]) {
    assetByVault.set(getAddress(vault.address), {
      address: getAddress(vault.asset.address),
      decimals: Math.round(vault.asset.decimals),
      priceUsd: vault.asset.price?.usd ?? null,
    });
  }

  // vaultAddress -> position amounts
  const positionByVault = new Map<string, { assets: BigIntish; assetsUsd: number | null }>();
  for (const position of response.user.vaultV2Positions) {
    positionByVault.set(getAddress(position.vault.address), {
      assets: position.assets,
      assetsUsd: position.assetsUsd ?? null,
    });
  }
  for (const position of response.user.vaultPositions) {
    if (!position.state) continue;
    positionByVault.set(getAddress(position.vault.address), {
      assets: position.state.assets ?? 0,
      assetsUsd: position.state.assetsUsd ?? null,
    });
  }

  const walletBalances = await getWalletTokenBalances(
    chainId,
    accountAddress,
    Array.from(assetByVault.values()).map((asset) => asset.address),
  );

  const positions: Record<string, VaultPosition> = {};

  for (const configured of configuredVaults) {
    const vaultAddress = getAddress(configured.address);
    const asset = assetByVault.get(vaultAddress);
    if (!asset) {
      console.warn(`Vault not returned by the API, skipping position: ${chainId}:${vaultAddress}`);
      continue;
    }

    const position = positionByVault.get(vaultAddress);
    const walletBalance = walletBalances.get(asset.address.toLowerCase());

    positions[vaultAddress] = {
      vault: {
        chain: { id: chainId },
        asset: { priceUsd: asset.priceUsd },
        vaultAddress,
      },
      assets: position
        ? toAmount(position.assets, asset.decimals, position.assetsUsd)
        : toAmountWithPrice(0, asset.decimals, asset.priceUsd),
      walletAssetHolding:
        walletBalance === undefined
          ? null
          : { balance: toAmountWithPrice(walletBalance, asset.decimals, asset.priceUsd) },
    };
  }

  return positions;
}
