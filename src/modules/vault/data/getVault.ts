import "server-only";

import { cache } from "react";
import type { Address } from "viem";
import { timeframe } from "@/common/utils/timeframe";
import type { SupportedChainId } from "@/config/types";
import { graphql } from "@/generated/gql/whisk";
import type { Erc4626VaultProtocol, Erc4626VaultQuery } from "@/generated/gql/whisk/graphql";
import { normalizeVault } from "@/modules/vault/utils/normalizeVault";
import { executeWhiskQuery } from "../../../common/utils/executeWhiskQuery";

const query = graphql(`
  query Erc4626Vault($key: Erc4626VaultKey!, $timeframe: ApyTimeframe!) {
    erc4626Vaults(where: {keys: [$key]}) {
      items {
        ...VaultSummaryFragment        
        __typename

        ... on MorphoVault {
          ...MorphoVaultV1Details
        }

        ... on MorphoVaultV2 {
          ...MorphoVaultV2Details
        }
      }
    }
  }
`);

type Erc4626VaultQueryItem = NonNullable<Erc4626VaultQuery["erc4626Vaults"]["items"][number]>;

export type Vault = Exclude<Erc4626VaultQueryItem, "chain"> & {
  isHidden: boolean;
  chain: Exclude<Erc4626VaultQueryItem["chain"], "id"> & { id: SupportedChainId };
};

export const getVault = cache(
  async (chainId: SupportedChainId, vaultAddress: Address, protocol: Erc4626VaultProtocol): Promise<Vault> => {
    const data = await executeWhiskQuery(query, {
      key: { chainId, vaultAddress, protocol },
      timeframe,
    });

    if (!data.erc4626Vaults) throw new Error(`Vault not found: ${chainId}:${vaultAddress}`);

    const vault = data.erc4626Vaults.items[0];

    if (!vault) throw new Error(`Vault not found: ${chainId}:${vaultAddress}`);

    return normalizeVault(vault);
  },
);
