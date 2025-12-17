import "server-only";

import type { Address } from "viem";
import { SUPPORTED_CHAIN_IDS } from "@/config";
import type { SupportedChainId } from "@/config/types";
import { graphql } from "@/generated/gql/whisk";
import type { MerklAccountRewardsQuery } from "@/generated/gql/whisk/graphql";
import { executeWhiskQuery } from "../../../common/utils/executeWhiskQuery";

const query = graphql(`
  query MerklAccountRewards($chainId: ChainId!, $accountAddress: Address!) {
    merklAccountRewards(chainId: $chainId, accountAddress: $accountAddress) {
        token {
          ...TokenInfoFragment
          chain {
            ...ChainInfoFragment
          }
        }

        creditedAmount {
          raw
        }

        claimableAmount {
          raw
          formatted
          usd
        }

        proofs
      }
  }
`);

export type MerklAccountReward = NonNullable<MerklAccountRewardsQuery["merklAccountRewards"][number]>;
export type MerklAccountRewardsMap = Partial<
  Record<SupportedChainId, { rewards: MerklAccountReward[]; totalUsd: number }>
>;

export const getAccountRewards = async (accountAddress: Address) => {
  const responses = await Promise.allSettled(
    SUPPORTED_CHAIN_IDS.map((chainId) =>
      executeWhiskQuery(query, {
        chainId,
        accountAddress,
      }),
    ),
  );

  const data = {} as MerklAccountRewardsMap;
  for (const [index, response] of responses.entries()) {
    const chainId = SUPPORTED_CHAIN_IDS[index]!;

    // Else the errors are logged at the fetch layer
    if (response.status === "fulfilled") {
      const filteredRewards = response.value.merklAccountRewards.filter(
        (reward) => BigInt(reward.claimableAmount.raw) > 0n,
      );
      if (filteredRewards.length > 0) {
        const totalUsd = filteredRewards.reduce((acc, reward) => acc + (reward.claimableAmount.usd ?? 0), 0);
        data[chainId] = { rewards: filteredRewards, totalUsd };
      }
    }
  }

  return data;
};

export type AccountRewards = NonNullable<Awaited<ReturnType<typeof getAccountRewards>>>;
