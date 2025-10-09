import { z } from "zod";
import { createOnchainAmountSchema } from "./onchain-amount";

export function createMarketSupplyCollateralAndBorrowFormSchema(market: {
  collateralAsset: { decimals: number };
  walletCollateralAssetBalanceRaw?: bigint;
}) {
  return z.object({
    supplyCollateralAmount: createOnchainAmountSchema({
      decimals: market.collateralAsset.decimals,
      maxAmount: market.walletCollateralAssetBalanceRaw ?? 0n,
    }),
    isMaxSupplyCollateral: z.boolean(),
    borrowAmount: createOnchainAmountSchema(),
  });
}

export function createMarketRepayAndWithdrawCollateralFormSchema(market: {
  loanAsset: { decimals: number };
  positionBorrowAmountRaw?: bigint;
}) {
  return z.object({
    repayAmount: createOnchainAmountSchema({
      decimals: market.loanAsset.decimals,
      maxAmount: market.positionBorrowAmountRaw ?? 0n,
    }),
    isMaxRepay: z.boolean(),
    withdrawCollateralAmount: createOnchainAmountSchema(),
    isMaxWithdrawCollateral: z.boolean(),
  });
}
