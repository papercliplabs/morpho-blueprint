import { z } from "zod";
import type { MarketNonIdle } from "@/data/whisk/getMarket";
import type { MarketPosition } from "@/data/whisk/getMarketPositions";
import { computeMaxBorrow } from "@/utils/math";
import { createOnchainAmountSchema } from "@/utils/schemas";

export function createMarketSupplyCollateralAndBorrowFormSchema(market: MarketNonIdle, position?: MarketPosition) {
  const walletCollateralAssetBalance = position?.walletCollateralAssetHolding
    ? BigInt(position.walletCollateralAssetHolding.balance.raw)
    : undefined;
  const positionBorrowBalance = position?.borrowAmount ? BigInt(position.borrowAmount.raw) : undefined;

  return z
    .object({
      supplyCollateralAmount: createOnchainAmountSchema({
        decimals: market.collateralAsset.decimals,
        min: 0n, // Allow 0 as value
        max: walletCollateralAssetBalance,
        maxErrorMessage: "Amount exceeds wallet balance.",
      }),
      isMaxSupplyCollateral: z.boolean(),
      borrowAmount: createOnchainAmountSchema({
        decimals: market.loanAsset.decimals,
        min: 0n, // Allow 0 as value
      }),
    })
    .superRefine((data, ctx) => {
      if (data.supplyCollateralAmount === 0n && data.borrowAmount === 0n) {
        ctx.addIssue({
          path: ["root"],
          code: "custom",
          message: "One amount is required.",
        });
      }

      const newBorrowAmount = (positionBorrowBalance ?? 0n) + data.borrowAmount;
      const maxBorrowAmount = computeMaxBorrow(market, data.supplyCollateralAmount, position);

      if (newBorrowAmount > maxBorrowAmount) {
        ctx.addIssue({
          path: ["borrowAmount"],
          code: "custom",
          message: "Causes unhealthy position.",
        });
      }
    });
}

export type MarketSupplyCollateralAndBorrowFormSchemaInput = z.input<
  ReturnType<typeof createMarketSupplyCollateralAndBorrowFormSchema>
>;
export type MarketSupplyCollateralAndBorrowFormSchemaOutput = z.output<
  ReturnType<typeof createMarketSupplyCollateralAndBorrowFormSchema>
>;
