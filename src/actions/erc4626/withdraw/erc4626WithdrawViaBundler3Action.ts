import { MathLib } from "@morpho-org/blue-sdk";
import { type Action, BundlerAction } from "@morpho-org/bundler-sdk-viem";
import { type Address, isAddressEqual, maxUint256 } from "viem";
import { requiredApprovalTransactionRequests } from "@/actions/subbundles/requiredApprovalTransactionRequests";
import { skimBundler3Actions } from "@/actions/subbundles/skimBundler3Actions";
import {
  type Erc4626WithdrawActionParameters,
  type TransactionRequest,
  UserFacingError,
  type VaultAction,
} from "@/actions/types";
import { getChainAddressesRequired } from "@/actions/utils/getChainAddressesRequired";
import { APP_CONFIG } from "@/config";
import { tryCatch } from "@/utils/tryCatch";
import { fetchErc4626WithdrawData, validateErc4626WithdrawParameters } from "./helpers";

/**
 * Action to withdraw from an ERC4626 vault via Bundler3.
 * The benefit of this over direct withdraw is slippage protection.
 * It is assumed the vault correctly implements the ERC-4626 specification: https://eips.ethereum.org/EIPS/eip-4626
 *
 * Note:
 * - While bundler3 also enables the use of permit and permit2 approvals, this action uses explicit approval transactions.
 *   This is to reduce complexity, and lends itself to a better UX for wallets with batching capabilities (EIP-5792).
 */
export async function erc4626WithdrawViaBundler3Action({
  client,
  vaultAddress,
  accountAddress,
  withdrawAmount,
  unwrapNativeAssets,
}: Erc4626WithdrawActionParameters): Promise<VaultAction> {
  validateErc4626WithdrawParameters({ vaultAddress, accountAddress, withdrawAmount });

  const isFullWithdraw = withdrawAmount === maxUint256;
  const { wrappedNativeAssetAddress, generalAdapter1Address } = getChainAddressesRequired(client.chain.id);

  const { data, error } = await tryCatch(
    // Spender is general adapter 1 since this is where we are routing the withdraw through
    fetchErc4626WithdrawData({ client, vaultAddress, accountAddress, withdrawAmount, spender: generalAdapter1Address }),
  );
  if (error) {
    throw new UserFacingError("Unable to load vault data.", { cause: error });
  }

  const { underlyingAssetAddress, maxWithdraw, initialPosition, allowance, quotedSharesRedeemed, maxRedeem } = data;

  // Validate liquidity and balance based on withdraw type
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
  if (initialPosition.shares === 0n) {
    throw new UserFacingError("Account has no shares to withdraw.");
  }

  const shouldUnwrap = isAddressEqual(underlyingAssetAddress, wrappedNativeAssetAddress) && unwrapNativeAssets;

  const { requiredAllowance, actions } = isFullWithdraw
    ? erc4626RedeemActions({
        vaultAddress,
        accountAddress,
        generalAdapter1Address,
        exactInputShares: initialPosition.shares,
        quotedOutputAssets: initialPosition.assets,
        shouldUnwrap,
      })
    : erc4626WithdrawActions({
        vaultAddress,
        accountAddress,
        generalAdapter1Address,
        quotedInputShares: quotedSharesRedeemed,
        exactOutputAssets: withdrawAmount,
        positionShares: initialPosition.shares,
        shouldUnwrap,
      });

  const transactionRequests: TransactionRequest[] = [];

  transactionRequests.push(
    ...requiredApprovalTransactionRequests({
      approvalTransactionName: "Approve withdraw amount",
      chainId: client.chain.id,
      erc20Address: vaultAddress, // Vault shares
      spenderAddress: generalAdapter1Address,
      currentAllowance: allowance,
      requiredAllowance: requiredAllowance,
    }),
  );

  // Skim any tokens which route through GA1, including native assets.
  actions.push(
    ...skimBundler3Actions({
      adapterAddress: generalAdapter1Address,
      erc20TokenAddresses: [underlyingAssetAddress, vaultAddress],
      accountAddress,
    }),
  );

  transactionRequests.push({
    name: "Withdraw from vault",
    tx: () => BundlerAction.encodeBundle(client.chain.id, actions),
  });

  return {
    chainId: client.chain.id,
    transactionRequests,
    signatureRequests: [],
    positionChange: {
      balance: {
        before: initialPosition.assets,
        after: isFullWithdraw ? 0n : initialPosition.assets - withdrawAmount,
      },
    },
  };
}

function erc4626RedeemActions({
  vaultAddress,
  accountAddress,
  generalAdapter1Address,
  exactInputShares, // Assumed non-zero (sanitized before calling)
  quotedOutputAssets,
  shouldUnwrap, // If true, assumes underlyingAssetAddress is the wrapped native asset (validated before calling)
}: {
  vaultAddress: Address;
  accountAddress: Address;
  generalAdapter1Address: Address;
  exactInputShares: bigint;
  quotedOutputAssets: bigint;
  shouldUnwrap: boolean;
}): { requiredAllowance: bigint; actions: Action[] } {
  // Slippage calculation: minimum amount of assets to receive per share, scaled by RAY (1e27)
  const minSharePriceRay = MathLib.mulDivUp(
    quotedOutputAssets,
    MathLib.wToRay(MathLib.WAD - APP_CONFIG.actionParameters.bundler3Config.slippageToleranceWad),
    exactInputShares,
  );

  const actions: Action[] = shouldUnwrap
    ? [
        // Asset flow:
        //  - shares: account -> vault (burned)
        //  - assets: vault -> GA1 -> unwrap -> account
        {
          // Redeem exact amount of inputShares on behalf of accountAddress, sending to GA1 as recipient
          type: "erc4626Redeem",
          args: [vaultAddress, exactInputShares, minSharePriceRay, generalAdapter1Address, accountAddress],
        },
        {
          // Unwrap all wrapped native assets within GA1, sending to account as recipient
          type: "unwrapNative",
          args: [maxUint256, accountAddress],
        },
      ]
    : [
        // Asset flow:
        //  - shares: account -> vault (burned)
        //  - assets: vault -> account
        {
          type: "erc4626Redeem",
          args: [vaultAddress, exactInputShares, minSharePriceRay, accountAddress, accountAddress],
        },
      ];

  return { requiredAllowance: exactInputShares, actions };
}

function erc4626WithdrawActions({
  vaultAddress,
  accountAddress,
  generalAdapter1Address,
  quotedInputShares, // Assumed non-zero (sanitized before calling)
  exactOutputAssets,
  positionShares,
  shouldUnwrap, // If true, assumes underlyingAssetAddress is the wrapped native asset (validated before calling)
}: {
  vaultAddress: Address;
  accountAddress: Address;
  generalAdapter1Address: Address;
  quotedInputShares: bigint;
  exactOutputAssets: bigint;
  positionShares: bigint;
  shouldUnwrap: boolean;
}) {
  // Slippage calculation: minimum amount of assets to receive per share, scaled by RAY (1e27)
  const minSharePriceRay = MathLib.mulDivUp(
    exactOutputAssets,
    MathLib.wToRay(MathLib.WAD - APP_CONFIG.actionParameters.bundler3Config.slippageToleranceWad),
    quotedInputShares,
  );

  // Max shares needed to get exactOutputAssets with worst-case slippage, clamped to position size
  // Note this will likely leave a dust share approval for GA1 (which is fine)
  const maxInputShares = MathLib.min(
    MathLib.mulDivUp(exactOutputAssets, MathLib.RAY, minSharePriceRay),
    positionShares,
  );

  const actions: Action[] = shouldUnwrap
    ? [
        // Asset flow:
        //  - shares: account -> vault (burned)
        //  - assets: vault -> GA1 -> unwrap -> account
        {
          type: "erc4626Withdraw",
          args: [vaultAddress, exactOutputAssets, minSharePriceRay, generalAdapter1Address, accountAddress],
        },
        {
          type: "unwrapNative",
          args: [maxUint256, accountAddress],
        },
      ]
    : [
        // Asset flow:
        //  - shares: account -> vault (burned)
        //  - assets: vault -> account (received)
        {
          type: "erc4626Withdraw",
          args: [vaultAddress, exactOutputAssets, minSharePriceRay, accountAddress, accountAddress],
        },
      ];

  return { requiredAllowance: maxInputShares, actions };
}
