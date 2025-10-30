import { encodeFunctionData, erc20Abi, erc4626Abi } from "viem";
import { simulateTransactionRequests } from "@/actions/utils/simulateTransactionsRequests";
import { tryCatch } from "@/utils/tryCatch";
import {
  type Erc4626SupplyActionParameters,
  type TransactionRequest,
  UserFacingError,
  type VaultAction,
} from "../../types";
import { fetchErc4626SupplyData, validateErc4626SupplyParameters, verifyErc4626SupplyAssetChanges } from "./helpers";

/**
 * Action to supply directly to an ERC4626 vault.
 * It is assumed the vault correctly implements the ERC-4626 specification: https://eips.ethereum.org/EIPS/eip-4626
 *
 * Note this has no slippage protection, meaning the supply is susceptible to share price inflation.
 * In practice, vaults generally protect against this.
 * See more on ERC-4626 inflation attacks here: https://docs.openzeppelin.com/contracts/5.x/erc4626
 */
export async function erc4626SupplyActionDirect({
  client,
  vaultAddress,
  accountAddress,
  supplyAmount,
}: Erc4626SupplyActionParameters): Promise<VaultAction> {
  validateErc4626SupplyParameters({ vaultAddress, accountAddress, supplyAmount });

  const { data, error } = await tryCatch(
    // Spender is vault address since we are calling deposit on the vault directly
    fetchErc4626SupplyData({ client, vaultAddress, accountAddress, supplyAmount, spender: vaultAddress }),
  );
  if (error) {
    throw new UserFacingError("Unable to load vault data.", { cause: error });
  }

  const {
    underlyingAssetAddress,
    accountUnderlyingAssetBalance,
    maxDeposit,
    allowance,
    initialPosition,
    quotedShares,
  } = data;

  if (maxDeposit < supplyAmount) {
    throw new UserFacingError("Supply amount exceeds the max deposit allowed by the vault.");
  }
  if (accountUnderlyingAssetBalance < supplyAmount) {
    throw new UserFacingError("Supply amount exceeds the account balance.");
  }

  const requiresApproval = allowance < supplyAmount;

  const transactionRequests: TransactionRequest[] = [];

  if (requiresApproval) {
    if (allowance > 0n) {
      // Revoke approval before setting new to avoid approval frontrunning attack
      // This can only occur if the vault has code which allows for someone to execute an action on the users behalf (we don't necessairly know the vaults implementation)
      // Note that USDT requires this as it will revert otherwise (frontrunning prevention built into the contract)
      transactionRequests.push({
        name: "Revoke existing approval",
        tx: () => ({
          to: underlyingAssetAddress,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: "approve",
            args: [vaultAddress, 0n],
          }),
        }),
      });
    }

    // Approve vault to spend supplyAmount of underlying assets
    transactionRequests.push({
      name: "Approve supply amount",
      tx: () => ({
        to: underlyingAssetAddress,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [vaultAddress, supplyAmount],
        }),
      }),
    });
  }

  // Supply to vault directly
  transactionRequests.push({
    name: "Supply to vault",
    tx: () => ({
      to: vaultAddress,
      data: encodeFunctionData({
        abi: erc4626Abi,
        functionName: "deposit",
        args: [supplyAmount, accountAddress],
      }),
    }),
  });

  const { data: simulationResult, error: simulationError } = await tryCatch(
    simulateTransactionRequests(client, accountAddress, transactionRequests),
  );
  if (simulationError) {
    throw new UserFacingError("Simulation failure.", { cause: simulationError });
  }

  const { data: finalPosition, error: verifyAssetChangesError } = await tryCatch(
    verifyErc4626SupplyAssetChanges({
      client,
      vaultAddress,
      underlyingAssetAddress,
      supplyAmount,
      assetChanges: simulationResult.assetChanges,
      quotedShares,
    }),
  );
  if (verifyAssetChangesError) {
    throw new UserFacingError("Asset change simuation check failure.", { cause: verifyAssetChangesError });
  }

  return {
    transactionRequests,
    signatureRequests: [], // No signatures since we use approval tx only
    positionChange: {
      balance: {
        before: initialPosition.assets,
        after: finalPosition.assets,
      },
    },
  };
}
