import { MathLib } from "@morpho-org/blue-sdk";
import { encodeFunctionData, erc4626Abi, isAddressEqual } from "viem";
import { wrappedNativeAssetAbi } from "@/abis/wrappedNativeAssetAbi";
import { requiredApprovalTransactionRequests } from "@/actions/subbundles/requiredApprovalTransactionRequests";
import { getChainAddressesRequired } from "@/actions/utils/getChainAddressesRequired";
import { tryCatch } from "@/utils/tryCatch";
import {
  type Erc4626SupplyActionParameters,
  type TransactionRequest,
  UserFacingError,
  type VaultAction,
} from "../../types";
import { fetchErc4626SupplyData, validateErc4626SupplyParameters } from "./helpers";

/**
 * Action to supply directly to an ERC4626 vault.
 * It is assumed the vault correctly implements the ERC-4626 specification, and does not expose approval frontrunning vulnerabilities:
 * - https://eips.ethereum.org/EIPS/eip-4626
 * - https://zokyo-auditing-tutorials.gitbook.io/zokyo-tutorials/tutorials/tutorial-3-approvals-and-safe-approvals/vulnerability-examples/erc20-approval-reset-requirement
 *
 * Note:
 * - This has no slippage protection, meaning the supply is susceptible to share price inflation.
 *   In practice, vaults generally protect against this (or against subsequent deflation after it occurs).
 *   See more on ERC-4626 inflation attacks here: https://docs.openzeppelin.com/contracts/5.x/erc4626
 * - When wrapping native assets, no gas reserve is enforced (can supply up to max native asset balance).
 *   This is to support functionality with sponsored tx. The UI is expected to enforce the margin itself if required.
 */
export async function erc4626SupplyActionDirect({
  client,
  vaultAddress,
  accountAddress,
  supplyAmount,
  allowNativeAssetWrapping,
}: Erc4626SupplyActionParameters): Promise<VaultAction> {
  validateErc4626SupplyParameters({ vaultAddress, accountAddress, supplyAmount });

  const { wrappedNativeAssetAddress } = getChainAddressesRequired(client.chain.id);

  const { data, error } = await tryCatch(
    // Spender is vault address since we are calling deposit on the vault directly
    fetchErc4626SupplyData({ client, vaultAddress, accountAddress, supplyAmount, spender: vaultAddress }),
  );
  if (error) {
    throw new UserFacingError("Unable to load vault data.", { cause: error });
  }

  const {
    accountNativeAssetBalance,
    underlyingAssetAddress,
    accountUnderlyingAssetBalance,
    quotedShares,
    allowance,
    initialPosition,
  } = data;

  const canWrapNativeAssets =
    isAddressEqual(underlyingAssetAddress, wrappedNativeAssetAddress) && allowNativeAssetWrapping;
  const shortfall = MathLib.zeroFloorSub(supplyAmount, accountUnderlyingAssetBalance);
  const nativeAssetWrapAmount = canWrapNativeAssets ? MathLib.min(shortfall, accountNativeAssetBalance) : 0n;

  // Perform checks which if not met will cause the transaction to revert
  if (accountUnderlyingAssetBalance + nativeAssetWrapAmount < supplyAmount) {
    throw new UserFacingError("Supply amount exceeds the account balance.");
  }
  if (quotedShares === 0n) {
    throw new UserFacingError("Vault quoted 0 shares. Try to increase the supply amount.");
  }

  const transactionRequests: TransactionRequest[] = [];

  if (nativeAssetWrapAmount > 0n) {
    // Wrap native assets
    transactionRequests.push({
      name: "Wrap native assets",
      tx: () => ({
        to: wrappedNativeAssetAddress,
        data: encodeFunctionData({
          abi: wrappedNativeAssetAbi,
          functionName: "deposit",
        }),
        value: nativeAssetWrapAmount,
      }),
    });
  }

  // Approve vault to spend underlying assets
  transactionRequests.push(
    ...requiredApprovalTransactionRequests({
      approvalTransactionName: "Approve supply amount",
      chainId: client.chain.id,
      erc20Address: underlyingAssetAddress,
      spenderAddress: vaultAddress,
      currentAllowance: allowance,
      requiredAllowance: supplyAmount, // full amount, since wrap happen within users wallet => transfer is the full supply amount
    }),
  );

  // Supply directly to vault
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
    chainId: client.chain.id,
    transactionRequests,
    signatureRequests: [],
    positionChange: {
      balance: {
        before: initialPosition.assets,
        after: initialPosition.assets + supplyAmount, // Ideally this is computed from simulation results. But, eth_simulateV1 is not yet supported on all chains
      },
    },
  };
}
