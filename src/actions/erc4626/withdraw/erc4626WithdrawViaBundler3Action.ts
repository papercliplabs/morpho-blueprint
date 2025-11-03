import { getChainAddresses, MathLib } from "@morpho-org/blue-sdk";
import { type Action, BundlerAction } from "@morpho-org/bundler-sdk-viem";
import { type Address, encodeFunctionData, erc4626Abi, maxUint256 } from "viem";
import {
  type Erc4626WithdrawActionParameters,
  type TransactionRequest,
  UserFacingError,
  type VaultAction,
} from "@/actions/types";
import { APP_CONFIG } from "@/config";
import { tryCatch } from "@/utils/tryCatch";
import { fetchErc4626WithdrawData, validateErc4626ActionParameters } from "../helpers";

/**
 * Action to withdraw from an ERC4626 vault via Bundler3.
 * The benefit of this over direct withdraw is slippage protection.
 * It is assumed the vault correctly implements the ERC-4626 specification: https://eips.ethereum.org/EIPS/eip-4626
 *
 * Note that while bundler3 also enables the use of permit2, this action uses explicit approval transactions.
 * This is to reduce complexity, and lends itself to a better UX for wallets with atomic batching capabilities (EIP-5792).
 */
export async function erc4626WithdrawViaBundler3Action({
  client,
  vaultAddress,
  accountAddress,
  withdrawAmount,
}: Erc4626WithdrawActionParameters): Promise<VaultAction> {
  validateErc4626ActionParameters({ vaultAddress, accountAddress, amount: withdrawAmount });

  // Will throw if unsupported chainId
  const {
    bundler3: { generalAdapter1: generalAdapter1Address },
  } = getChainAddresses(client.chain.id);

  const { data, error } = await tryCatch(
    // Spender is general adapter 1 since this is where we are routing the withdraw through
    fetchErc4626WithdrawData({ client, vaultAddress, accountAddress, withdrawAmount, spender: generalAdapter1Address }),
  );
  if (error) {
    throw new UserFacingError("Unable to load vault data.", { cause: error });
  }

  const { maxWithdraw, initialPosition, allowance, quotedSharesRedeemed, maxRedeem } = data;

  const isFullWithdraw = withdrawAmount === maxUint256;

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
    if (initialPosition.assets < withdrawAmount || initialPosition.shares === 0n) {
      throw new UserFacingError("Withdraw amount exceeds account balance.");
    }
  }
  if (quotedSharesRedeemed === 0n) {
    throw new UserFacingError("Vault quoted 0 shares redeemed. Try to increase the withdraw amount.");
  }

  // Build transaction requests based on withdraw type
  const transactionRequests = isFullWithdraw
    ? buildErc4626RedeemTransactionRequests({
        chainId: client.chain.id,
        vaultAddress,
        accountAddress,
        generalAdapter1Address,
        exactInputShares: initialPosition.shares,
        quotedOutputAssets: initialPosition.assets,
        allowance,
      })
    : buildErc4626WithdrawTransactionRequests({
        chainId: client.chain.id,
        vaultAddress,
        accountAddress,
        generalAdapter1Address,
        quotedInputShares: quotedSharesRedeemed,
        exactOutputAssets: withdrawAmount,
        positionShares: initialPosition.shares,
        allowance,
      });

  return {
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

/**
 * Creates an approval transaction if needed for vault share spending.
 * GA1 is a known and immutable contract without approval frontrunning vulnerabilities, so we don't revoke existing approvals.
 */
function buildApprovalTransactionIfNeeded({
  vaultAddress,
  generalAdapter1Address,
  sharesToApprove,
  currentAllowance,
}: {
  vaultAddress: Address;
  generalAdapter1Address: Address;
  sharesToApprove: bigint;
  currentAllowance: bigint;
}): TransactionRequest[] {
  if (currentAllowance >= sharesToApprove) {
    return [];
  }

  return [
    {
      name: "Approve withdraw amount",
      tx: () => ({
        to: vaultAddress,
        data: encodeFunctionData({
          abi: erc4626Abi,
          functionName: "approve",
          args: [generalAdapter1Address, sharesToApprove],
        }),
      }),
    },
  ];
}

function buildErc4626RedeemTransactionRequests({
  chainId,
  vaultAddress,
  accountAddress,
  generalAdapter1Address,
  exactInputShares, // Assumed non-zero (sanitized before calling)
  quotedOutputAssets,
  allowance,
}: {
  chainId: number;
  vaultAddress: Address;
  accountAddress: Address;
  generalAdapter1Address: Address;
  exactInputShares: bigint;
  quotedOutputAssets: bigint;
  allowance: bigint;
}) {
  const transactionRequests: TransactionRequest[] = [];

  // Add approval if needed
  transactionRequests.push(
    ...buildApprovalTransactionIfNeeded({
      vaultAddress,
      generalAdapter1Address,
      sharesToApprove: exactInputShares,
      currentAllowance: allowance,
    }),
  );

  // Slippage calculation: minimum amount of assets to receive per share, scaled by RAY (1e27)
  const minSharePriceRay = MathLib.mulDivUp(
    quotedOutputAssets,
    MathLib.wToRay(MathLib.WAD - APP_CONFIG.actionParameters.bundler3Config.slippageToleranceWad),
    exactInputShares,
  );

  // Withdraw from vault via bundler3 with slippage protection
  // Asset flow:
  //  - shares: account -> vault (burned)
  //  - assets: vault -> account (received)
  transactionRequests.push({
    name: "Withdraw from vault",
    tx: () =>
      BundlerAction.encodeBundle(chainId, [
        {
          // Redeem exact amount of inputShares on behalf of accountAddress (uses share approval from above)
          type: "erc4626Redeem",
          args: [vaultAddress, exactInputShares, minSharePriceRay, accountAddress, accountAddress],
        } satisfies Action,
      ]),
  });

  return transactionRequests;
}

function buildErc4626WithdrawTransactionRequests({
  chainId,
  vaultAddress,
  accountAddress,
  generalAdapter1Address,
  quotedInputShares, // Assumed non-zero (sanitized before calling)
  exactOutputAssets,
  positionShares,
  allowance,
}: {
  chainId: number;
  vaultAddress: Address;
  accountAddress: Address;
  generalAdapter1Address: Address;
  quotedInputShares: bigint;
  exactOutputAssets: bigint;
  positionShares: bigint;
  allowance: bigint;
}) {
  // Slippage calculation: minimum amount of assets to receive per share, scaled by RAY (1e27)
  const minSharePriceRay = MathLib.mulDivUp(
    exactOutputAssets,
    MathLib.wToRay(MathLib.WAD - APP_CONFIG.actionParameters.bundler3Config.slippageToleranceWad),
    quotedInputShares,
  );

  // Max shares needed for worst-case slippage, clamped to position size
  // Note this will likely leave a dust share approval for GA1 (which is fine)
  const maxInputShares = MathLib.min(
    MathLib.mulDivUp(exactOutputAssets, MathLib.RAY, minSharePriceRay),
    positionShares,
  );

  const transactionRequests: TransactionRequest[] = [];

  // Add approval if needed
  transactionRequests.push(
    ...buildApprovalTransactionIfNeeded({
      vaultAddress,
      generalAdapter1Address,
      sharesToApprove: maxInputShares,
      currentAllowance: allowance,
    }),
  );

  // Withdraw from vault via bundler3 with slippage protection
  // Asset flow:
  //  - shares: account -> vault (burned)
  //  - assets: vault -> account (received)
  transactionRequests.push({
    name: "Withdraw from vault",
    tx: () =>
      BundlerAction.encodeBundle(chainId, [
        {
          // Withdraw exact amount of outputAssets on behalf of accountAddress (uses share approval from above)
          type: "erc4626Withdraw",
          args: [vaultAddress, exactOutputAssets, minSharePriceRay, accountAddress, accountAddress],
        } satisfies Action,
      ]),
  });

  return transactionRequests;
}
