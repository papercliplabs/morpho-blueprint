import { encodeFunctionData, erc4626Abi, maxUint256 } from "viem";
import {
  type Erc4626WithdrawActionParameters,
  type TransactionRequest,
  UserFacingError,
  type VaultAction,
} from "@/actions/types";
import { tryCatch } from "@/utils/tryCatch";
import { fetchErc4626WithdrawData, validateErc4626ActionParameters } from "../helpers";

/**
 * Action to withdraw directly from an ERC4626 vault.
 * It is assumed the vault correctly implements the ERC-4626 specification: https://eips.ethereum.org/EIPS/eip-4626
 *
 * Note this has no slippage protection, meaning the supply is susceptible to share price deflation.
 * In practice, vaults generally protect against this.
 */
export async function erc4626WithdrawActionDirect({
  client,
  vaultAddress,
  accountAddress,
  withdrawAmount,
}: Erc4626WithdrawActionParameters): Promise<VaultAction> {
  validateErc4626ActionParameters({ vaultAddress, accountAddress, amount: withdrawAmount });

  const { data, error } = await tryCatch(
    // Spender is vault address since we are calling withdraw on the vault directly
    fetchErc4626WithdrawData({ client, vaultAddress, accountAddress, withdrawAmount }),
  );
  if (error) {
    throw new UserFacingError("Unable to load vault data.", { cause: error });
  }

  const { maxWithdraw, initialPosition, maxRedeem, quotedSharesRedeemed } = data;

  const isFullWithdraw = withdrawAmount === maxUint256;

  if (isFullWithdraw) {
    // Just sanity check for disabled vaults for maxRedeem since actual value can be an underestimate due to rounding and can cause false negatives
    if (maxRedeem === 0n) {
      throw new UserFacingError("Vault is currently preventing redemptions. This could be due to low liquidity.");
    }
  } else {
    if (maxWithdraw < withdrawAmount) {
      throw new UserFacingError("Insufficient liquidity to withdraw requested amount.");
    }
    if (initialPosition.assets < withdrawAmount) {
      throw new UserFacingError("Withdraw amount exceeds account balance.");
    }
  }
  if (quotedSharesRedeemed === 0n) {
    throw new UserFacingError("Vault quoted 0 shares redeemed. Try to increase the withdraw amount.");
  }

  const transactionRequests: TransactionRequest[] = [];

  // Withdraw from vault directly, doesn't need any approvals
  if (isFullWithdraw) {
    // Redeems all shares to ensure no dust is left
    transactionRequests.push({
      name: "Withdraw from vault",
      tx: () => ({
        to: vaultAddress,
        data: encodeFunctionData({
          abi: erc4626Abi,
          functionName: "redeem",
          args: [initialPosition.shares, accountAddress, accountAddress],
        }),
      }),
    });
  } else {
    transactionRequests.push({
      name: "Withdraw from vault",
      tx: () => ({
        to: vaultAddress,
        data: encodeFunctionData({
          abi: erc4626Abi,
          functionName: "withdraw",
          args: [withdrawAmount, accountAddress, accountAddress],
        }),
      }),
    });
  }

  return {
    chainId: client.chain.id,
    transactionRequests,
    signatureRequests: [], // No signatures since we use approval tx only
    positionChange: {
      balance: {
        before: initialPosition.assets,
        after: isFullWithdraw ? 0n : initialPosition.assets - withdrawAmount, // Ideally this is computed from simulation results. But, eth_simulateV1 is not yet supported on all chains
      },
    },
  };
}
