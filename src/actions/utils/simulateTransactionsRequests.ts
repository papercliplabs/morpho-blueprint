import type { Address } from "viem";
import { simulateCalls } from "viem/actions";
import type { PublicClientWithChain, TransactionRequest } from "../types";

export async function simulateTransactionRequests(
  client: PublicClientWithChain,
  accountAddress: Address,
  transactionRequests: TransactionRequest[],
) {
  console.log(
    "DEBUG",
    transactionRequests,
    transactionRequests.map((request) => request.tx()),
  );

  const { assetChanges, results } = await simulateCalls(client, {
    account: accountAddress,
    calls: transactionRequests.map((request) => {
      const tx = request.tx();
      return {
        from: accountAddress,
        to: tx.to,
        data: tx.data,
      };
    }),
    traceAssetChanges: true,
  });

  const failedResults = results.filter((result) => result.status === "failure");
  const successfulResults = results.filter((result) => result.status === "success");

  // Throw if there are any failed results - all must succeed
  failedResults.forEach((result) => {
    throw result.error;
  });

  return { assetChanges, results: successfulResults };
}

export type SimulateTransactionRequestsResult = Awaited<ReturnType<typeof simulateTransactionRequests>>;
