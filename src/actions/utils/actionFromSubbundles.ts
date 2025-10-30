import type { ChainId } from "@morpho-org/blue-sdk";

import type { Action, Subbundle } from "../types";

import { encodeBundlerCalls } from "./encodeBundlerCalls";

// Encode subbundles into an action in the order they are provided
export function actionFromSubbundles(chainId: ChainId, subbundles: Subbundle[], executeBundleName: string): Action {
  return {
    signatureRequests: subbundles.flatMap((subbundle) => subbundle.signatureRequirements),
    transactionRequests: [
      ...subbundles.flatMap((subbundle) => subbundle.transactionRequirements),
      {
        tx: () => {
          // Just in time so we can use signatures
          const bundlerCalls = subbundles.flatMap((subbundle) =>
            typeof subbundle.bundlerCalls === "function" ? subbundle.bundlerCalls() : subbundle.bundlerCalls,
          );
          return encodeBundlerCalls(chainId, bundlerCalls);
        },
        name: executeBundleName,
      },
    ],
  };
}
