import { getChainAddresses, MathLib } from "@morpho-org/blue-sdk";
import { isAddressEqual } from "viem";
import type { Vault } from "@/data/whisk/getVault";
import { NATIVE_ASSET_GAS_RESERVE_UNITS } from "@/utils/constants";

export function isVaultUnderlyingAssetWrappedNativeAsset(vault: Vault) {
  const { wNative: wrappedNativeAssetAddress } = getChainAddresses(vault.chain.id);
  if (!wrappedNativeAssetAddress) {
    // Unknown wrapped native asset address
    return false;
  }
  return isAddressEqual(vault.asset.address, wrappedNativeAssetAddress);
}

export function computeAvailableBalance({
  accountLoanTokenBalance,
  accountNativeAssetBalance,
  maxFeePerGas,
  includeNativeAssetWrapping,
}: {
  accountLoanTokenBalance?: bigint;
  accountNativeAssetBalance?: bigint;
  maxFeePerGas?: bigint;
  includeNativeAssetWrapping: boolean;
}) {
  if (!includeNativeAssetWrapping) {
    return accountLoanTokenBalance;
  }

  if (maxFeePerGas === undefined || accountLoanTokenBalance === undefined || accountNativeAssetBalance === undefined) {
    return undefined;
  }

  const gasFeeReserveWei = NATIVE_ASSET_GAS_RESERVE_UNITS * maxFeePerGas;
  const spendableNativeAssetBalance = MathLib.zeroFloorSub(accountNativeAssetBalance, gasFeeReserveWei);

  return accountLoanTokenBalance + spendableNativeAssetBalance;
}
