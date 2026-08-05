import "server-only";

import { type Address, formatUnits, getAddress, type Hex } from "viem";
import { z } from "zod";
import { fetchJsonResponse } from "@/common/utils/fetch";
import { SUPPORTED_CHAIN_IDS } from "@/config";
import type { SupportedChainId } from "@/config/types";

const MERKL_API_BASE_URL = "https://api.merkl.xyz/v4";

// Proof elements are encoded as `bytes32[][]` by the claim action, so anything else would throw
// during calldata encoding instead of dropping just the offending reward here
const bytes32Schema = z
  .string()
  .regex(/^0x[0-9a-fA-F]{64}$/, "Invalid bytes32")
  .transform((value) => value as Hex);

// Every transform below must be total: `safeParse` does not trap exceptions thrown inside one, so a
// throw would escape `parseValidEntries` and fail the whole request instead of dropping one entry
const addressSchema = z.string().transform((value, ctx) => {
  try {
    return getAddress(value);
  } catch {
    ctx.addIssue({ code: "custom", message: `Invalid address: ${value}` });
    return z.NEVER;
  }
});

// Merkl serializes uint256 amounts as decimal strings. Reject anything else rather than coercing:
// a JSON number has already lost precision above 2^53 by the time we see it, and BigInt() would
// happily accept "0x10" as 16 or "" as 0. The proof commits to the exact amount, so a silently
// wrong value here produces a reverting claim instead of a dropped reward.
const amountSchema = z.string().transform((value, ctx) => {
  if (!/^\d+$/.test(value)) {
    ctx.addIssue({ code: "custom", message: `Invalid amount: ${value}` });
    return z.NEVER;
  }
  return BigInt(value);
});

const merklTokenSchema = z.object({
  address: addressSchema,
  symbol: z.string(),
  name: z.string().nullish(),
  decimals: z.number().int().nonnegative(),
  icon: z.string().nullish(),
  price: z.number().nullish(),
  type: z.string(),
  isTest: z.boolean(),
});

const merklRewardSchema = z.object({
  // Cumulative credited amount. This is what the distributor expects, it pays out the delta itself.
  amount: amountSchema,
  claimed: amountSchema,
  proofs: z.array(bytes32Schema),
  token: merklTokenSchema,
});

const merklChainSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  icon: z.string(),
});

// Rewards are validated per entry so a single malformed one doesn't drop the whole chain
const merklChainRewardsSchema = z.object({
  chain: merklChainSchema,
  rewards: z.array(z.unknown()),
});

const merklAccountRewardsResponseSchema = z.array(z.unknown());

/**
 * Shape of a single claimable reward, kept identical to what Whisk's `merklAccountRewards` returned
 * so the components and the `/api/account/[address]/rewards` route contract are unchanged.
 */
export interface MerklAccountReward {
  token: {
    address: Address;
    symbol: string;
    name: string;
    decimals: number;
    icon: string | null;
    category: null;
    chain: { id: SupportedChainId; name: string; icon: string };
  };
  creditedAmount: { raw: string };
  claimableAmount: { raw: string; formatted: string; usd: number | null };
  proofs: Hex[];
}

export type MerklAccountRewardsMap = Partial<
  Record<SupportedChainId, { rewards: MerklAccountReward[]; totalUsd: number }>
>;

function parseValidEntries<T>(schema: z.ZodType<T>, entries: unknown[], label: string): T[] {
  const valid: T[] = [];
  for (const entry of entries) {
    const result = schema.safeParse(entry);
    if (result.success) {
      valid.push(result.data);
    } else {
      console.warn(`Dropping invalid Merkl ${label}: ${z.prettifyError(result.error)}`);
    }
  }
  return valid;
}

function isSupportedChainId(chainId: number): chainId is SupportedChainId {
  return (SUPPORTED_CHAIN_IDS as readonly number[]).includes(chainId);
}

function breakdownsUrl(accountAddress: Address, chainIds: readonly number[]): URL {
  // `getAddress` validates; Merkl's API contract wants the path address lowercase.
  const url = new URL(`${MERKL_API_BASE_URL}/users/${getAddress(accountAddress).toLowerCase()}/rewards/breakdowns`);
  // `chainIds` is required and plural, the singular form is rejected with a 400
  for (const chainId of chainIds) {
    url.searchParams.append("chainIds", chainId.toString());
  }
  url.searchParams.set("claimableOnly", "true");
  return url;
}

export const getAccountRewards = async (accountAddress: Address): Promise<MerklAccountRewardsMap> => {
  let response: unknown;
  try {
    // All chains come back in a single request on the happy path.
    response = await fetchJsonResponse<unknown>(breakdownsUrl(accountAddress, SUPPORTED_CHAIN_IDS));
  } catch {
    // Merkl rejects the entire request if any single chain id is unknown to it, so retry per chain:
    // a chain Merkl does not index degrades only itself instead of zeroing rewards app-wide. Chains
    // that still fail degrade to no rewards (errors are logged at the fetch layer), matching the
    // previous per-chain `Promise.allSettled` behavior.
    const settled = await Promise.allSettled(
      SUPPORTED_CHAIN_IDS.map((chainId) => fetchJsonResponse<unknown>(breakdownsUrl(accountAddress, [chainId]))),
    );
    response = settled.flatMap((result) =>
      result.status === "fulfilled" && Array.isArray(result.value) ? result.value : [],
    );
  }

  const parsedResponse = merklAccountRewardsResponseSchema.safeParse(response);
  if (!parsedResponse.success) {
    console.warn(`Unexpected Merkl rewards response: ${z.prettifyError(parsedResponse.error)}`);
    return {};
  }

  const data: MerklAccountRewardsMap = {};
  for (const chainEntry of parseValidEntries(merklChainRewardsSchema, parsedResponse.data, "chain entry")) {
    const chainId = chainEntry.chain.id;
    if (!isSupportedChainId(chainId)) {
      continue;
    }

    const rewards: MerklAccountReward[] = [];
    for (const reward of parseValidEntries(merklRewardSchema, chainEntry.rewards, "reward")) {
      const { token } = reward;

      // Whisk parity: real, non-test tokens only, and no protocol filter
      if (token.type !== "TOKEN" || token.isTest) {
        continue;
      }

      // `claimableOnly=true` should already guarantee this, but the distributor would revert on a zero claim
      const claimable = reward.amount - reward.claimed;
      if (claimable <= 0n) {
        continue;
      }

      // A claimable entry with no Merkle proof cannot be claimed — including it would revert the
      // whole chain-wide claim batch instead of just skipping this reward.
      if (reward.proofs.length === 0) {
        continue;
      }

      const formatted = formatUnits(claimable, token.decimals);
      rewards.push({
        token: {
          address: token.address,
          symbol: token.symbol,
          name: token.name ?? token.symbol,
          decimals: token.decimals,
          icon: token.icon || null,
          category: null,
          chain: { id: chainId, name: chainEntry.chain.name, icon: chainEntry.chain.icon },
        },
        creditedAmount: { raw: reward.amount.toString() },
        claimableAmount: {
          raw: claimable.toString(),
          formatted,
          usd: token.price == null ? null : Number(formatted) * token.price,
        },
        proofs: reward.proofs,
      });
    }

    if (rewards.length > 0) {
      const totalUsd = rewards.reduce((acc, reward) => acc + (reward.claimableAmount.usd ?? 0), 0);
      data[chainId] = { rewards, totalUsd };
    }
  }

  return data;
};

export type AccountRewards = NonNullable<Awaited<ReturnType<typeof getAccountRewards>>>;
