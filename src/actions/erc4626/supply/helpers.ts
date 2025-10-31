import { type Address, erc20Abi, erc4626Abi, isAddressEqual, zeroAddress } from "viem";
import { multicall } from "viem/actions";
import { type Erc4626SupplyActionParameters, type Position, UserFacingError } from "@/actions/types";

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
