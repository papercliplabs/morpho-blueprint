import "server-only";

import { type Address, createPublicClient, erc20Abi, fallback, getAddress, http } from "viem";
import { tryCatch } from "@/common/utils/tryCatch";
import { APP_CONFIG } from "@/config";
import type { SupportedChainId } from "@/config/types";

/** Lowercased token address -> raw balance. */
export type WalletTokenBalances = Map<string, bigint>;

/**
 * Wallet ERC-20 balances are the one thing no Morpho API exposes (by design), so they are joined in
 * from the chain.
 *
 * This runs on the server and talks to the configured RPC URLs directly. It must NOT go through
 * `/api/rpc/[chainId]`: that proxy's origin check rejects server-to-server calls.
 *
 * Failures degrade to "no balances" rather than throwing, matching the rest of the data layer:
 * partial data still renders.
 */
export async function getWalletTokenBalances(
  chainId: SupportedChainId,
  accountAddress: Address,
  tokenAddresses: readonly Address[],
): Promise<WalletTokenBalances> {
  const balances: WalletTokenBalances = new Map();

  const uniqueTokens = Array.from(new Set(tokenAddresses.map((address) => getAddress(address))));
  if (uniqueTokens.length === 0) return balances;

  const chainConfig = APP_CONFIG.chainConfig[chainId];
  if (!chainConfig) {
    console.warn(`No chain config for ${chainId}, skipping wallet balances.`);
    return balances;
  }

  const client = createPublicClient({
    chain: chainConfig.chain,
    transport: fallback(chainConfig.rpcUrls.map((url) => http(url))),
    // viem's multicall `batchSize` is a calldata *byte* budget, not a call count. `maxRpcBatchSize`
    // is a count (`wagmi.ts` and `/api/rpc/[chainId]` both use it as one), and `balanceOf(address)`
    // calldata is 36 bytes — over that 32 budget — so passing it here put every token in its own
    // eth_call and defeated the batching entirely. viem's 1024-byte default fits ~28 calls.
    batch: { multicall: true },
  });

  const { data, error } = await tryCatch(
    client.multicall({
      contracts: uniqueTokens.map((address) => ({
        address,
        abi: erc20Abi,
        functionName: "balanceOf" as const,
        args: [accountAddress] as const,
      })),
      allowFailure: true,
    }),
  );

  if (error || !data) {
    console.warn(`Failed to read wallet balances on chain ${chainId}`, { error });
    return balances;
  }

  data.forEach((result, index) => {
    const token = uniqueTokens[index];
    if (!token) return;
    if (result.status !== "success") {
      console.warn(`balanceOf failed for ${token} on chain ${chainId}`, { error: result.error });
      return;
    }
    balances.set(token.toLowerCase(), result.result);
  });

  return balances;
}
