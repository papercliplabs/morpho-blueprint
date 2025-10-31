import { MathLib } from "@morpho-org/blue-sdk";
import { type Address, erc20Abi, erc4626Abi, isAddressEqual, zeroAddress } from "viem";
import { multicall, readContract } from "viem/actions";
import { SHARE_SANITY_TOLERANCE_WAD } from "@/actions/constants";
import { type Erc4626SupplyActionParameters, type Position, UserFacingError } from "@/actions/types";
import type { SimulateTransactionRequestsResult } from "@/actions/utils/simulateTransactionsRequests";

export function validateErc4626SupplyParameters({
  vaultAddress,
  accountAddress,
  supplyAmount,
}: Omit<Erc4626SupplyActionParameters, "client">) {
  if (supplyAmount <= 0n) {
    throw new UserFacingError("Invalid input: Supply amount must be greater than 0.");
  }

  if (
    isAddressEqual(accountAddress, zeroAddress) ||
    isAddressEqual(vaultAddress, zeroAddress) ||
    isAddressEqual(accountAddress, vaultAddress)
  ) {
    throw new UserFacingError("Invalid input: Account and vault addresses must be distinct and non-zero.");
  }
}

/**
 * Fetch data for erc4626 supply action.
 *
 * @param spender - The address which needs the approval to spend the users underlying assets.
 */
export async function fetchErc4626SupplyData({
  client,
  vaultAddress,
  accountAddress,
  supplyAmount,
  spender,
}: Erc4626SupplyActionParameters & {
  spender: Address;
}) {
  const [underlyingAssetAddress, maxDeposit, quotedShares, initialPositionShares] = await multicall(client, {
    contracts: [
      {
        abi: erc4626Abi,
        address: vaultAddress,
        functionName: "asset",
        args: [],
      },
      {
        abi: erc4626Abi,
        address: vaultAddress,
        functionName: "maxDeposit",
        args: [accountAddress],
      },
      {
        abi: erc4626Abi,
        address: vaultAddress,
        functionName: "previewDeposit",
        args: [supplyAmount],
      },
      {
        abi: erc4626Abi,
        address: vaultAddress,
        functionName: "balanceOf",
        args: [accountAddress],
      },
    ],
    allowFailure: false,
  });

  const [accountUnderlyingAssetBalance, allowance, initialPositionAssets] = await multicall(client, {
    contracts: [
      {
        abi: erc20Abi,
        address: underlyingAssetAddress,
        functionName: "balanceOf",
        args: [accountAddress],
      },
      {
        abi: erc20Abi,
        address: underlyingAssetAddress,
        functionName: "allowance",
        args: [accountAddress, spender],
      },
      {
        abi: erc4626Abi,
        address: vaultAddress,
        functionName: "previewRedeem",
        args: [initialPositionShares],
      },
    ],
    allowFailure: false,
  });

  return {
    underlyingAssetAddress,
    maxDeposit,
    quotedShares,
    accountUnderlyingAssetBalance,
    allowance,
    initialPosition: {
      shares: initialPositionShares,
      assets: initialPositionAssets,
    } satisfies Position,
  };
}

export async function verifyErc4626SupplyAssetChanges({
  client,
  vaultAddress,
  underlyingAssetAddress,
  supplyAmount,
  assetChanges,
  quotedShares,
}: Omit<Erc4626SupplyActionParameters, "accountAddress"> & {
  underlyingAssetAddress: Address;
  assetChanges: SimulateTransactionRequestsResult["assetChanges"];
  quotedShares: bigint;
}): Promise<Position> {
  // Only expect vault asset and vault shares to change
  if (assetChanges.length !== 2) {
    throw new Error(`Unexpected number of asset changes: ${assetChanges.length}.`, { cause: assetChanges });
  }

  const vaultShareChange = assetChanges.find((change) => isAddressEqual(change.token.address, vaultAddress));
  const underlyingAssetChange = assetChanges.find((change) =>
    isAddressEqual(change.token.address, underlyingAssetAddress),
  );

  if (!vaultShareChange || !underlyingAssetChange) {
    throw new Error("Missing expected asset changes.");
  }

  // Supply asset change should exactly equal the supply amount
  // Note diff should be negative since it's from the perspective of the account
  if (-supplyAmount !== underlyingAssetChange.value.diff) {
    throw new Error("Unexpected underlying asset change.");
  }

  // Share change should be within a sanity tolerance of what was quoted
  // Note this is NOT a slippage check, it is a sanity check that in simulation the vault gave us close to the quoted shares.
  // This is expected to always pass unless the vault is malicious.
  const minExpectedShares = MathLib.wMulUp(quotedShares, MathLib.WAD - SHARE_SANITY_TOLERANCE_WAD);
  if (vaultShareChange.value.diff < minExpectedShares) {
    throw new Error("Simulated share change is much less than quoted.");
  }

  const finalPositionAssets = await readContract(client, {
    abi: erc4626Abi,
    address: vaultAddress,
    functionName: "previewRedeem",
    args: [vaultShareChange.value.post],
  });

  return {
    shares: vaultShareChange.value.post,
    assets: finalPositionAssets,
  };
}
