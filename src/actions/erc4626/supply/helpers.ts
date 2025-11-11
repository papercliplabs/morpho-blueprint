import { type Address, erc20Abi, erc4626Abi, isAddressEqual, maxUint256, zeroAddress } from "viem";
import { getBalance, multicall } from "viem/actions";
import { type Erc4626SupplyActionParameters, type Position, UserFacingError } from "@/actions/types";

export function validateErc4626SupplyParameters({
  vaultAddress,
  accountAddress,
  amount,
}: {
  vaultAddress: Address;
  accountAddress: Address;
  amount: bigint;
}) {
  if (amount <= 0n) {
    throw new UserFacingError("Invalid input: Amount must be greater than 0.");
  }

  // Disallow maxUint256 also, since this has special handling in GA1
  if (amount >= maxUint256) {
    throw new UserFacingError("Invalid input: Amount must be less than maxUint256.");
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
}: Omit<Erc4626SupplyActionParameters, "allowNativeAssetWrapping"> & {
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

  const accountNativeAssetBalance = await getBalance(client, { address: accountAddress });

  return {
    accountNativeAssetBalance,
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
