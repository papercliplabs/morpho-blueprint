import { getChainAddresses, MathLib } from "@morpho-org/blue-sdk";
import { isAddressEqual } from "viem";
import { NATIVE_ASSET_GAS_RESERVE_UNITS } from "@/common/utils/constants";
import type { Vault } from "@/modules/vault/data/getVault";

import "@/actions/morphoSdkPatch";

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
  if (accountLoanTokenBalance === undefined || maxFeePerGas === undefined || accountNativeAssetBalance === undefined) {
    return undefined;
  }

  // Fallback to accountLoanTokenBalance when wrapping disabled, or missing data to compute the available native balance
  if (!includeNativeAssetWrapping) {
    return accountLoanTokenBalance;
  }

  const gasFeeReserveWei = NATIVE_ASSET_GAS_RESERVE_UNITS * maxFeePerGas;
  const spendableNativeAssetBalance = MathLib.zeroFloorSub(accountNativeAssetBalance, gasFeeReserveWei);

  return accountLoanTokenBalance + spendableNativeAssetBalance;
}
