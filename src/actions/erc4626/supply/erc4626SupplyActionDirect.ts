import { encodeFunctionData, erc20Abi, erc4626Abi } from "viem";
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
 * It is assumed the vault correctly implements the ERC-4626 specification: https://eips.ethereum.org/EIPS/eip-4626
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

  const { underlyingAssetAddress, accountUnderlyingAssetBalance, maxDeposit, allowance, initialPosition } = data;

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
      // We do not need to revoke existing approval if our trust assumption is that the vault is not malicious, and doesn't have an approval frontrunning vulnerability.
      // BUT, some tokens like USDT are non ERC-20 compliant, requiring zeroing of the allowance before setting a new value:
      // https://zokyo-auditing-tutorials.gitbook.io/zokyo-tutorials/tutorials/tutorial-3-approvals-and-safe-approvals/vulnerability-examples/erc20-approval-reset-requirement
      // For this reason, we will still revoke the existing approval if it exists. It is a rare case this is needed since supply actions do not leave any "dust" approvals (always exact input).
      // If it is known all underlying tokens being interacted with are ERC-20 compliant, and all vault have no approval frontrunning vulnerabilities, this can be removed.
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
