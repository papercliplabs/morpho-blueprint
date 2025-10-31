import { type Address, erc20Abi, erc4626Abi, isAddressEqual, maxUint256, zeroAddress } from "viem";
import { multicall, readContract } from "viem/actions";
import {
  type Erc4626SupplyActionParameters,
  type Erc4626WithdrawActionParameters,
  type Position,
  UserFacingError,
} from "@/actions/types";

export function validateErc4626ActionParameters({
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
}: Erc4626WithdrawActionParameters & {
  spender?: Address;
}) {
  const [underlyingAssetAddress, maxWithdraw, initialPositionShares] = await multicall(client, {
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
        address: underlyingAssetAddress,
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
    quotedSharesRedeemed,
    allowance: spender ? allowance : 0n,
    initialPosition: {
      shares: initialPositionShares,
      assets: initialPositionAssets,
    } satisfies Position,
  };
}
