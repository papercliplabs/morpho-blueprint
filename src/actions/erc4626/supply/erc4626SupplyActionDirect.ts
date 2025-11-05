import { encodeFunctionData, erc20Abi, erc4626Abi } from "viem";
import { TOKENS_REQUIRING_APPROVAL_REVOCATION } from "@/actions/constants";
import type { SupportedChainId } from "@/config/types";
import { tryCatch } from "@/utils/tryCatch";
import {
  type Erc4626SupplyActionParameters,
  type TransactionRequest,
  UserFacingError,
  type VaultAction,
} from "../../types";
import { fetchErc4626SupplyData, validateErc4626ActionParameters } from "../helpers";

/**
 * Action to supply directly to an ERC4626 vault.
 * It is assumed the vault correctly implements the ERC-4626 specification, and does not expose approval frontrunning vulnerabilities:
 * - https://eips.ethereum.org/EIPS/eip-4626
 * - https://zokyo-auditing-tutorials.gitbook.io/zokyo-tutorials/tutorials/tutorial-3-approvals-and-safe-approvals/vulnerability-examples/erc20-approval-reset-requirement
 *
 * Note this has no slippage protection, meaning the supply is susceptible to share price inflation.
 * In practice, vaults generally protect against this (or against subsequent deflation after it occurs).
 * See more on ERC-4626 inflation attacks here: https://docs.openzeppelin.com/contracts/5.x/erc4626
 */
export async function erc4626SupplyActionDirect({
  client,
  vaultAddress,
  accountAddress,
  supplyAmount,
}: Erc4626SupplyActionParameters): Promise<VaultAction> {
  validateErc4626ActionParameters({ vaultAddress, accountAddress, amount: supplyAmount });

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
    quotedShares,
    allowance,
    initialPosition,
  } = data;

  if (maxDeposit < supplyAmount) {
    throw new UserFacingError("Supply amount exceeds the max deposit allowed by the vault.");
  }
  if (accountUnderlyingAssetBalance < supplyAmount) {
    throw new UserFacingError("Supply amount exceeds the account balance.");
  }
  if (quotedShares === 0n) {
    throw new UserFacingError("Vault quoted 0 shares. Try to increase the supply amount.");
  }

  const requiresApproval = allowance < supplyAmount;

  const transactionRequests: TransactionRequest[] = [];

  if (requiresApproval) {
    // Revoke existing approval if needed
    if (allowance > 0n && TOKENS_REQUIRING_APPROVAL_REVOCATION[client.chain.id]?.[underlyingAssetAddress]) {
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

  return {
    transactionRequests,
    signatureRequests: [], // No signatures since we use approval tx only
    positionChange: {
      balance: {
        before: initialPosition.assets,
        after: initialPosition.assets + supplyAmount, // Ideally this is computed from simulation results. But, eth_simulateV1 is not yet supported on all chains
      },
    },
  };
}
