import { DEFAULT_SLIPPAGE_TOLERANCE } from "@morpho-org/blue-sdk";
import { Address, maxUint256 } from "viem";

import { getIsContract } from "@/actions/data/rpc/getIsContract";
import { getSimulationState } from "@/actions/data/rpc/getSimulationState";

import { actionFromInputOps } from "../utils/actionFromInputOps";
import { computeVaultPositionChange } from "../utils/positionChange";
import { PublicClientWithChain, VaultAction } from "../utils/types";

interface VaultWithdrawActionParameters {
  publicClient: PublicClientWithChain;
  vaultAddress: Address;
  accountAddress: Address;
  withdrawAmount: bigint; // Max uint256 for entire position balanace
}

export async function vaultWithdrawAction({
  publicClient,
  vaultAddress,
  accountAddress,
  withdrawAmount,
}: VaultWithdrawActionParameters): Promise<VaultAction> {
  if (withdrawAmount <= 0n) {
    return {
      status: "error",
      message: "Withdraw amount must be greater than 0.",
    };
  }

  const [initialSimulationState, isContract] = await Promise.all([
    getSimulationState({
      actionType: "vault",
      accountAddress,
      vaultAddress,
      publicClient,
    }),
    getIsContract(publicClient, accountAddress),
  ]);

  const userShareBalance = initialSimulationState.getHolding(accountAddress, vaultAddress).balance;
  const isMaxWithdraw = withdrawAmount == maxUint256;

  const preparedAction = actionFromInputOps(
    publicClient.chain.id,
    [
      {
        type: "MetaMorpho_Withdraw",
        sender: accountAddress,
        address: vaultAddress,
        args: {
          // Use shares if a max withdraw to prevent dust
          ...(isMaxWithdraw ? { shares: userShareBalance } : { assets: withdrawAmount }),
          owner: accountAddress,
          receiver: accountAddress,
          slippage: DEFAULT_SLIPPAGE_TOLERANCE,
        },
      },
    ],
    accountAddress,
    isContract,
    initialSimulationState,
    "Confirm Withdraw"
  );

  if (preparedAction.status == "success") {
    return {
      ...preparedAction,
      positionChange: computeVaultPositionChange(
        vaultAddress,
        accountAddress,
        initialSimulationState,
        preparedAction.finalSimulationState
      ),
    };
  } else {
    return preparedAction;
  }
}
