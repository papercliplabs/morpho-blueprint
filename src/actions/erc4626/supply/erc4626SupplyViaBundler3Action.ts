import { getChainAddresses, MathLib } from "@morpho-org/blue-sdk";
import { BundlerAction } from "@morpho-org/bundler-sdk-viem";
import { encodeFunctionData, erc20Abi } from "viem";
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
 * It is assumed the vault correctly implements the ERC-4626 specification: https://eips.ethereum.org/EIPS/eip-4626
 *
 * Note that while bundler3 also enables the use of permit2, this action uses explicit approval transactions.
 * This is to reduce complexity, and lends itself to a better UX for wallets with atomic batching capabilities (EIP-5792).
 */
export async function erc4626SupplyViaBundler3Action({
  client,
  vaultAddress,
  accountAddress,
  supplyAmount,
}: Erc4626SupplyActionParameters): Promise<VaultAction> {
  validateErc4626ActionParameters({ vaultAddress, accountAddress, amount: supplyAmount });

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
  if (quotedShares === 0n) {
    throw new UserFacingError("Vault quoted 0 shares. Try to increase the supply amount.");
  }

  const requiresApproval = allowance < supplyAmount;

  const transactionRequests: TransactionRequest[] = [];

  if (requiresApproval) {
    // Technically, we do not need to revoke existing approval since we are approving GA1 which is an immutable contract without approval frontrunning vulnerabilities.
    // BUT, some tokens like USDT are non ERC-20 compliant, requiring zeroing of the allowance before setting a new value:
    // https://zokyo-auditing-tutorials.gitbook.io/zokyo-tutorials/tutorials/tutorial-3-approvals-and-safe-approvals/vulnerability-examples/erc20-approval-reset-requirement
    // For this reason, we will still revoke the existing approval if it exists. It is a rare case this is needed since supply actions do not leave any "dust" approvals (always exact input).
    // If it is known all underlying tokens being interacted with are ERC-20 compliant, this can be removed.
    if (allowance > 0n) {
      transactionRequests.push({
        name: "Revoke existing approval",
        tx: () => ({
          to: underlyingAssetAddress,
          data: encodeFunctionData({ abi: erc20Abi, functionName: "approve", args: [generalAdapter1Address, 0n] }),
        }),
      });
    }

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
  const maxSharePriceRay = MathLib.mulDivDown(
    supplyAmount,
    MathLib.wToRay(MathLib.WAD + APP_CONFIG.actionParameters.bundler3Config.slippageToleranceWad),
    quotedShares,
  );

  // Supply to vault via bundler3 with slippage protection
  // Asset flow:
  //  - assets: account -> GA1 -> vault
  //  - shares: vault -> account (minted)
  transactionRequests.push({
    name: "Supply to vault",
    tx: () =>
      BundlerAction.encodeBundle(client.chain.id, [
        {
          // Transfer supplyAmount of underlying assets from account into GA1 (uses approval from above)
          // Note GA1 requires assets are in adapter for ERC-4626 deposit
          type: "erc20TransferFrom",
          args: [underlyingAssetAddress, supplyAmount, generalAdapter1Address],
        },
        {
          // Supply supplyAmount of underlying assets to the vault on behalf of the account
          // Note there will be no dust left since exact input
          type: "erc4626Deposit",
          args: [vaultAddress, supplyAmount, maxSharePriceRay, accountAddress],
        },
      ]),
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
