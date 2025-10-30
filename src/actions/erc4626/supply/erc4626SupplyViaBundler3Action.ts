import { getChainAddresses, MathLib } from "@morpho-org/blue-sdk";
import { BundlerAction } from "@morpho-org/bundler-sdk-viem";
import { encodeFunctionData, erc20Abi } from "viem";
import { MAX_ABSOLUTE_SHARE_PRICE_RAY } from "@/actions/constants";
import { simulateTransactionRequests } from "@/actions/utils/simulateTransactionsRequests";
import { APP_CONFIG } from "@/config";
import { tryCatch } from "@/utils/tryCatch";
import {
  type Erc4626SupplyActionParameters,
  type TransactionRequest,
  UserFacingError,
  type VaultAction,
} from "../../types";
import { fetchErc4626SupplyData, validateErc4626SupplyParameters, verifyErc4626SupplyAssetChanges } from "./helpers";

/**
 * Action to supply to an ERC4626 vault via Bundler3.
 * The benefit of this over direct supply is slippage protection.
 * It is assumed the vault correctly implements the ERC-4626 specification: https://eips.ethereum.org/EIPS/eip-4626
 *
 * Note that while bundler3 also enables the use of permit2, this action uses explicit approval transactions.
 * This is to reduce complexity, and lends itself to a better UX for EIP-5792 enabled wallets (atomic batching).
 */
export async function erc4626SupplyViaBundler3Action({
  client,
  vaultAddress,
  accountAddress,
  supplyAmount,
}: Erc4626SupplyActionParameters): Promise<VaultAction> {
  validateErc4626SupplyParameters({ vaultAddress, accountAddress, supplyAmount });

  if (APP_CONFIG.actionParameters.bundler3Config === "disabled") {
    throw new UserFacingError("Bundler3 is not enabled.");
  }

  // Will throw if unsupported chainId
  const {
    bundler3: { generalAdapter1: generalAdapter1Address },
  } = getChainAddresses(client.chain.id);

  const { data, error } = await tryCatch(
    // Spender is general adapter 1 since this is where we are routing the supply through
    fetchErc4626SupplyData({ client, vaultAddress, accountAddress, supplyAmount, spender: generalAdapter1Address }),
  );
  if (error) {
    throw new UserFacingError("Unable to load vault data.", { cause: error });
  }

  const {
    underlyingAssetAddress,
    accountUnderlyingAssetBalance,
    quotedShares,
    maxDeposit,
    allowance,
    initialPosition,
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
    // We do not need to revoke existing approval since we are approving GA1.
    // GA1 is a known contract and doesn't have a approval frontrunning attack vulnerability

    // Approve GA1 to spend supplyAmount of underlying assets
    transactionRequests.push({
      name: "Approve supply amount",
      tx: () => ({
        to: underlyingAssetAddress,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [generalAdapter1Address, supplyAmount],
        }),
      }),
    });
  }

  // Slippage calculation, this is the amount of assets to pay to get 1 share, scaled by RAY (1e27)
  const maxSharePriceRay = MathLib.min(
    MathLib.mulDivUp(
      supplyAmount,
      MathLib.wToRay(MathLib.WAD + APP_CONFIG.actionParameters.bundler3Config.slippageToleranceWad),
      quotedShares,
    ),
    MAX_ABSOLUTE_SHARE_PRICE_RAY,
  );

  // Supply to vault via bundler3 with slippage protection
  transactionRequests.push({
    name: "Supply to vault",
    tx: () =>
      BundlerAction.encodeBundle(client.chain.id, [
        {
          // Transfer supplyAmount of underlying assets from account into GA1 (uses approval from above)
          type: "erc20TransferFrom",
          args: [underlyingAssetAddress, supplyAmount, generalAdapter1Address],
        },
        {
          // Supply supplyAmount of underlying assets to the vault on behalf of the account
          type: "erc4626Deposit",
          args: [vaultAddress, supplyAmount, maxSharePriceRay, accountAddress],
        },
      ]),
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
