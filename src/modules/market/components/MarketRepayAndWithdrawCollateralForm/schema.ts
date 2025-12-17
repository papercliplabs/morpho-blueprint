import { MathLib } from "@morpho-org/blue-sdk";
import { z } from "zod";
import { createOnchainAmountSchema } from "@/common/utils/schemas";
import type { MarketNonIdle } from "@/modules/market/data/getMarket";
import type { MarketPosition } from "@/modules/market/data/getMarketPositions";
import { computeRequiredCollateral } from "@/modules/market/utils/computeRequiredCollateral";

export function createMarketRepayAndWithdrawCollateralFormSchema(market: MarketNonIdle, position?: MarketPosition) {
  const positionBorrowBalance = position?.borrowAmount ? BigInt(position.borrowAmount.raw) : undefined;
  const positionCollateralBalance = position?.collateralAmount ? BigInt(position.collateralAmount.raw) : undefined;
  const walletLoanAssetBalance = position?.walletLoanAssetHolding
    ? BigInt(position.walletLoanAssetHolding.balance.raw)
    : undefined;

  const repayLimiter = (positionBorrowBalance ?? 0n) < (walletLoanAssetBalance ?? 0n) ? "position" : "wallet-balance";

  return z
    .object({
      repayAmount: createOnchainAmountSchema({
        decimals: market.loanAsset.decimals,
        min: 0n, // Allow 0 as value
        max: repayLimiter === "position" ? positionBorrowBalance : walletLoanAssetBalance,
        maxErrorMessage: repayLimiter === "position" ? "Exceeds position." : "Exceeds wallet balance.",
      }),
      isMaxRepay: z.boolean(), // Max means full position
      withdrawCollateralAmount: createOnchainAmountSchema({
        decimals: market.collateralAsset.decimals,
        min: 0n, // Allow 0 as value
        max: positionCollateralBalance,
        maxErrorMessage: "Exceeds collateral balance.",
      }),
    })
    .superRefine((data, ctx) => {
      if (data.repayAmount === 0n && data.withdrawCollateralAmount === 0n) {
        ctx.addIssue({
          path: ["root"],
          code: "custom",
          message: "One amount is required.",
        });
      }

      const newCollateralAmount = MathLib.max((positionCollateralBalance ?? 0n) - data.withdrawCollateralAmount, 0n);

      const requiredCollateral = computeRequiredCollateral(market, -data.repayAmount, position);
      if (newCollateralAmount < requiredCollateral) {
        ctx.addIssue({
          path: ["withdrawCollateralAmount"],
          code: "custom",
          message: "Causes unhealthy position.",
        });
      }
    });
}

export type MarketRepayAndWithdrawCollateralFormSchemaInput = z.input<
  ReturnType<typeof createMarketRepayAndWithdrawCollateralFormSchema>
>;
export type MarketRepayAndWithdrawCollateralFormSchemaOutput = z.output<
  ReturnType<typeof createMarketRepayAndWithdrawCollateralFormSchema>
>;
