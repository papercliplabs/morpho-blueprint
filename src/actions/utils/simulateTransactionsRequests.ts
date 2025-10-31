import { type Address, erc20Abi } from "viem";
import { multicall, simulateCalls } from "viem/actions";
import type { PublicClientWithChain, TransactionRequest } from "../types";

/**
 * Simulate a list of transaction requests ensuring no failures.
 * Compute asset changes for tokens in tokenBalancesToCheck.
 *
 * Note: assetChange are only computed for tokens in tokenBalancesToCheck since trackAssetChanges cannot be used reliability due to lack of eth_createAccessList support across chains.
 */
export async function simulateTransactionRequests(
  client: PublicClientWithChain,
  accountAddress: Address,
  transactionRequests: TransactionRequest[],
  tokenBalancesToCheck: Address[],
) {
  const preBalances = await multicall(client, {
    contracts: tokenBalancesToCheck.map(
      (tokenAddress) =>
        ({
          abi: erc20Abi,
          address: tokenAddress,
          functionName: "balanceOf",
          args: [accountAddress],
        }) as const,
    ),
    allowFailure: false,
  });

  const { results } = await simulateCalls(client, {
    account: accountAddress,
    calls: [
      ...transactionRequests.map((request) => {
        const tx = request.tx();
        return {
          to: tx.to,
          data: tx.data,
        };
      }),
      ...tokenBalancesToCheck.map((tokenAddress) => ({
        to: tokenAddress,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [accountAddress],
      })),
    ],
    // Ideally we could use this instead of tokenBalancesToCheck, but eth_createAccessList RPC method is not supported on all chains...
    traceAssetChanges: false,
  });

  const failedResults = results.filter((result) => result.status === "failure");
  const successfulResults = results.filter((result) => result.status === "success");

  // Throw if there are any failed results - all must succeed
  failedResults.forEach((result) => {
    throw result.error;
  });

  // Same format as simulateCalls's assetChanges (fields we care about)
  const assetChanges = tokenBalancesToCheck.map((tokenAddress, i) => {
    const pre = preBalances[i];
    const post = successfulResults[i + transactionRequests.length]?.result as bigint | undefined;
    if (pre === undefined || post === undefined) {
      throw new Error(`Token balance not found for token address: ${tokenAddress}.`);
    }

    return {
      token: {
        address: tokenAddress,
      },
      value: {
        pre,
        post,
        diff: post - pre,
      },
    };
  });

  return { assetChanges, results: successfulResults };
}

export type SimulateTransactionRequestsResult = Awaited<ReturnType<typeof simulateTransactionRequests>>;
