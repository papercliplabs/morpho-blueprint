import { encodeFunctionData, erc4626Abi, isAddressEqual, maxUint256 } from "viem";
import { wrappedNativeAssetAbi } from "@/abis/wrappedNativeAssetAbi";
import {
  type Erc4626WithdrawActionParameters,
  type TransactionRequest,
  UserFacingError,
  type VaultAction,
} from "@/actions/types";
import { getChainAddressesRequired } from "@/actions/utils/getChainAddressesRequired";
import { tryCatch } from "@/utils/tryCatch";
import { fetchErc4626WithdrawData, validateErc4626WithdrawParameters } from "./helpers";

/**
 * Action to withdraw directly from an ERC4626 vault.
 * It is assumed the vault correctly implements the ERC-4626 specification: https://eips.ethereum.org/EIPS/eip-4626
 *
 * Note:
 * - This has no slippage protection, meaning the supply is susceptible to share price deflation.
 *   In practice, vaults generally protect against this.
 * - When unwrapping native assets during a full withdraw, any interest accrued between action build and execution will be left as dust wrapped native assets in the wallet.
 */
export async function erc4626WithdrawActionDirect({
  client,
  vaultAddress,
  accountAddress,
  withdrawAmount,
  unwrapNativeAssets,
}: Erc4626WithdrawActionParameters): Promise<VaultAction> {
  validateErc4626WithdrawParameters({ vaultAddress, accountAddress, amount: withdrawAmount });

  const isFullWithdraw = withdrawAmount === maxUint256;
  const { wrappedNativeAssetAddress } = getChainAddressesRequired(client.chain.id);

  const { data, error } = await tryCatch(
    // Spender is vault address since we are calling withdraw on the vault directly
    fetchErc4626WithdrawData({ client, vaultAddress, accountAddress, withdrawAmount }),
  );
  if (error) {
    throw new UserFacingError("Unable to load vault data.", { cause: error });
  }

  const { underlyingAssetAddress, maxWithdraw, initialPosition, maxRedeem, quotedSharesRedeemed } = data;

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

  const shouldUnwrap = isAddressEqual(underlyingAssetAddress, wrappedNativeAssetAddress) && unwrapNativeAssets;

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

  if (shouldUnwrap) {
    // For full withdraws, this will leave any interest accrued between action build and execution as dust wrapped native assets within the wallet
    // Note: wNative.withdraw uses msg.sender.transfer, which will revert if the caller is a contract without a payable fallback function
    transactionRequests.push({
      name: "Unwrap native asset",
      tx: () => ({
        to: wrappedNativeAssetAddress,
        data: encodeFunctionData({
          abi: wrappedNativeAssetAbi,
          functionName: "withdraw",
          args: [isFullWithdraw ? initialPosition.assets : withdrawAmount],
        }),
      }),
    });
  }

  return {
    chainId: client.chain.id,
    transactionRequests,
    signatureRequests: [],
    positionChange: {
      balance: {
        before: initialPosition.assets,
        after: isFullWithdraw ? 0n : initialPosition.assets - withdrawAmount, // Ideally this is computed from simulation results. But, eth_simulateV1 is not yet supported on all chains
      },
    },
  };
}
