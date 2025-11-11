import { type Address, erc20Abi, erc4626Abi, isAddressEqual, maxUint256, zeroAddress } from "viem";
import { multicall, readContract } from "viem/actions";
import { type Erc4626WithdrawActionParameters, type Position, UserFacingError } from "@/actions/types";

export function validateErc4626WithdrawParameters({
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
  if (amount > maxUint256) {
    throw new UserFacingError("Invalid input: Amount must be less than or equal to maxUint256.");
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
 * Fetch data for erc4626 withdraw action.
 *
 * @param spender - The address which needs approval to redeem the users shares (if any).
 */
export async function fetchErc4626WithdrawData({
  client,
  vaultAddress,
  accountAddress,
  withdrawAmount,
  spender,
}: Omit<Erc4626WithdrawActionParameters, "unwrapNativeAssets"> & {
  spender?: Address;
}) {
  const [underlyingAssetAddress, maxWithdraw, maxRedeem, initialPositionShares] = await multicall(client, {
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
        functionName: "maxWithdraw",
        args: [accountAddress],
      },
      {
        abi: erc4626Abi,
        address: vaultAddress,
        functionName: "maxRedeem",
        args: [accountAddress],
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

  const [initialPositionAssets, allowance] = await multicall(client, {
    contracts: [
      {
        abi: erc4626Abi,
        address: vaultAddress,
        functionName: "previewRedeem",
        args: [initialPositionShares],
      },

      // Unused if spender is not provided
      {
        abi: erc20Abi,
        address: vaultAddress,
        functionName: "allowance",
        args: [accountAddress, spender ?? zeroAddress],
      },
    ],
    allowFailure: false,
  });

  let quotedSharesRedeemed = initialPositionShares;
  if (withdrawAmount !== maxUint256) {
    // Only call when not max withdraw to avoid failure here with maxUint256 withdraw amount
    quotedSharesRedeemed = await readContract(client, {
      abi: erc4626Abi,
      address: vaultAddress,
      functionName: "previewWithdraw",
      args: [withdrawAmount],
    });
  }

  return {
    underlyingAssetAddress,
    maxWithdraw,
    maxRedeem,
    quotedSharesRedeemed,
    allowance: spender ? allowance : 0n,
    initialPosition: {
      shares: initialPositionShares,
      assets: initialPositionAssets,
    } satisfies Position,
  };
}
