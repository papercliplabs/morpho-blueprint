import { type Address, encodeFunctionData, type Hex } from "viem";
import { merklDistributorAbi } from "@/actions/abis/merklDistributorAbi";
import { MERKL_DISTRIBUTOR_ADDRESS } from "./constants";
import { type Action, UserFacingError } from "./types";

interface BuildClaimMerklRewardsActionParameters {
  chainId: number;
  accountAddress: Address;
  tokens: Address[];
  creditedAmounts: bigint[];
  proofs: Hex[][];
}

export function claimMerklRewardsAction({
  chainId,
  accountAddress,
  tokens,
  creditedAmounts,
  proofs,
}: BuildClaimMerklRewardsActionParameters): Action {
  const len = tokens.length;
  if (creditedAmounts.length !== len || proofs.length !== len) {
    throw new UserFacingError("Invalid arguments, must have same length");
  }

  return {
    chainId,
    transactionRequests: [
      {
        name: "Claim rewards",
        tx: () => ({
          to: MERKL_DISTRIBUTOR_ADDRESS,
          data: encodeFunctionData({
            abi: merklDistributorAbi,
            functionName: "claim",
            args: [Array(len).fill(accountAddress), tokens, creditedAmounts, proofs],
          }),
        }),
      },
    ],
    signatureRequests: [],
  };
}
