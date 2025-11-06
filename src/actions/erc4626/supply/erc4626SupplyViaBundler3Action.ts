import { getChainAddresses, MathLib } from "@morpho-org/blue-sdk";
import { type Action, BundlerAction } from "@morpho-org/bundler-sdk-viem";
import { encodeFunctionData, erc20Abi, isAddressEqual } from "viem";
import { TOKENS_REQUIRING_APPROVAL_REVOCATION } from "@/actions/constants";
import { APP_CONFIG } from "@/config";
import { tryCatch } from "@/utils/tryCatch";
import {
  type Erc4626SupplyActionParameters,
  type TransactionRequest,
  UserFacingError,
  type VaultAction,
} from "../../types";
import { fetchErc4626SupplyData, validateErc4626ActionParameters } from "../helpers";

/**
 * Action to supply to an ERC4626 vault via Bundler3.
 * The benefit of this over direct supply is slippage protection.
 * It is assumed the vault correctly implements the ERC-4626 specification, and does not expose approval frontrunning vulnerabilities:
 * - https://eips.ethereum.org/EIPS/eip-4626
 * - https://zokyo-auditing-tutorials.gitbook.io/zokyo-tutorials/tutorials/tutorial-3-approvals-and-safe-approvals/vulnerability-examples/erc20-approval-reset-requirement
 *
 * Notes:
 * - While bundler3 also enables the use of permit2, this action uses explicit approval transactions.
 *   This is to reduce complexity, and lends itself to a better UX for wallets with atomic batching capabilities (EIP-5792).
 * - When wrapping native assets, no gas reserve is enforced (can supply up to max native asset balance), which allows gas sponsored txs to use full balance.
 *   The UI is expected to enforce the margin itself if required.
 */
export async function erc4626SupplyViaBundler3Action({
  client,
  vaultAddress,
  accountAddress,
  supplyAmount,
  allowNativeAssetWrapping,
}: Erc4626SupplyActionParameters): Promise<VaultAction> {
  validateErc4626ActionParameters({ vaultAddress, accountAddress, amount: supplyAmount });

  // Will throw if unsupported chainId
  const {
    bundler3: { generalAdapter1: generalAdapter1Address },
    wNative: wrappedNativeAssetAddress,
  } = getChainAddresses(client.chain.id);
  if (!wrappedNativeAssetAddress) {
    throw new UserFacingError(`Unknown wrapped native asset address for chain ${client.chain.id}.`);
  }

  const { data, error } = await tryCatch(
    // Spender is general adapter 1 since this is where we are routing the supply through
    fetchErc4626SupplyData({ client, vaultAddress, accountAddress, supplyAmount, spender: generalAdapter1Address }),
  );
  if (error) {
    throw new UserFacingError("Unable to load vault data.", { cause: error });
  }

  const {
    accountNativeAssetBalance,
    underlyingAssetAddress,
    accountUnderlyingAssetBalance,
    quotedShares,
    maxDeposit,
    allowance,
    initialPosition,
  } = data;

  const isUnderlyingAssetWrappedNativeAsset = isAddressEqual(underlyingAssetAddress, wrappedNativeAssetAddress);
  const canWrapNativeAssets = allowNativeAssetWrapping && isUnderlyingAssetWrappedNativeAsset;

  // Calculate wrap amount if applicable
  const shortfall = MathLib.zeroFloorSub(supplyAmount, accountUnderlyingAssetBalance);
  const nativeAssetWrapAmount = canWrapNativeAssets ? MathLib.min(shortfall, accountNativeAssetBalance) : 0n;
  const underlyingAssetTransferAmount = supplyAmount - nativeAssetWrapAmount; // Wrapping happens inside GA1, so only need to transfer the diff required for the supply

  if (maxDeposit < supplyAmount) {
    throw new UserFacingError("Supply amount exceeds the max deposit allowed by the vault.");
  }
  if (accountUnderlyingAssetBalance + nativeAssetWrapAmount < supplyAmount) {
    throw new UserFacingError("Supply amount exceeds the account balance.");
  }
  if (quotedShares === 0n) {
    throw new UserFacingError("Vault quoted 0 shares. Try to increase the supply amount.");
  }

  const transactionRequests: TransactionRequest[] = [];

  // Only need to approve the difference between supplyAmount and nativeAssetWrapAmount since we wrap inside bundler3
  if (allowance < underlyingAssetTransferAmount) {
    // Revoke existing approval if required
    if (allowance > 0n && TOKENS_REQUIRING_APPROVAL_REVOCATION[client.chain.id]?.[underlyingAssetAddress]) {
      transactionRequests.push({
        name: "Revoke existing approval",
        tx: () => ({
          to: underlyingAssetAddress,
          data: encodeFunctionData({ abi: erc20Abi, functionName: "approve", args: [generalAdapter1Address, 0n] }),
        }),
      });
    }

    // Approve GA1 to spend underlyingAssetTransferAmount of underlying assets
    transactionRequests.push({
      name: "Approve supply amount",
      tx: () => ({
        to: underlyingAssetAddress,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [generalAdapter1Address, underlyingAssetTransferAmount],
        }),
      }),
    });
  }

  // Slippage calculation, this is the amount of assets to pay to get 1 share, scaled by RAY (1e27)
  const maxSharePriceRay = MathLib.mulDivDown(
    supplyAmount,
    MathLib.wToRay(MathLib.WAD + APP_CONFIG.actionParameters.bundler3Config.slippageToleranceWad),
    quotedShares,
  );

  // Supply to vault via bundler3 with slippage protection
  // Note GA1 requires assets are in adapter for ERC-4626 deposit
  // Asset flow:
  //  - native asset (if application): account -> GA1 -> wrap to GA1 -> vault
  //  - underlying assets: account -> GA1 -> vault
  //  - shares: vault -> account (minted)
  const actions: Action[] = [];

  if (nativeAssetWrapAmount > 0n) {
    // Transfer nativeAssetWrapAmount to GA1 with this tx
    // Note, this is not actually a call it's just how Morpho SDK specifies value: https://github.com/morpho-org/sdks/blob/main/packages/bundler-sdk-viem/src/BundlerAction.ts#L69-L80
    actions.push({
      type: "nativeTransfer",
      args: [accountAddress, generalAdapter1Address, nativeAssetWrapAmount],
    } satisfies Action);

    // Wrap native sent with this tx to GA1 as recipient
    // These will be combined with the underlying assets transfered to GA1 (next tx) before depositing into the vault
    actions.push({
      type: "wrapNative",
      args: [nativeAssetWrapAmount, generalAdapter1Address],
    } satisfies Action);
  }

  // Transfer underlyingAssetTransferAmount of underlying assets from account into GA1 (uses approval from above)
  if (underlyingAssetTransferAmount > 0n) {
    actions.push({
      type: "erc20TransferFrom",
      args: [underlyingAssetAddress, underlyingAssetTransferAmount, generalAdapter1Address],
    } satisfies Action);
  }

  // Supply supplyAmount of underlying assets to the vault on behalf of the account
  // Note there will be no dust left since exact input (supplyAmount = underlyingAssetTransferAmount + nativeAssetWrapAmount)
  actions.push({
    type: "erc4626Deposit",
    args: [vaultAddress, supplyAmount, maxSharePriceRay, accountAddress],
  } satisfies Action);

  // Encode actions for bundler3 call
  transactionRequests.push({
    name: "Supply to vault",
    tx: () => BundlerAction.encodeBundle(client.chain.id, actions),
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
