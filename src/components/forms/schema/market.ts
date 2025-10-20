import { parseUnits } from "viem";
import { z } from "zod";
import type { MarketNonIdle } from "@/data/whisk/getMarket";
import type { MarketPosition } from "@/data/whisk/getMarketPositions";
import { computeAvailableToBorrow, computeMarketMaxWithdrawCollateral } from "@/utils/math";
import { createOnchainAmountSchema } from "./onchain-amount";

export function createMarketSupplyCollateralAndBorrowFormSchema(params: {
  market: MarketNonIdle;
  currentPosition?: MarketPosition;
  collateralAsset: { decimals: number };
  walletCollateralAssetBalanceRaw?: bigint;
}) {
  const { market, currentPosition } = params;

  return z
    .object({
      supplyCollateralAmount: createOnchainAmountSchema({
        decimals: params.collateralAsset.decimals,
        maxAmount: params.walletCollateralAssetBalanceRaw ?? 0n,
      }),
      isMaxSupplyCollateral: z.boolean(),
      borrowAmount: createOnchainAmountSchema(),
    })
    .superRefine((values, ctx) => {
      if (!currentPosition) return; // can't validate without position context

      const supplyStr = values.supplyCollateralAmount === "" ? "0" : values.supplyCollateralAmount;
      const borrowStr = values.borrowAmount === "" ? "0" : values.borrowAmount;

      // Convert user string amounts to numbers for math helpers
      const supplyDelta = Number(supplyStr);

      // Require at least one of the fields to be > 0
      if ((Number(supplyStr) || 0) === 0 && (Number(borrowStr) || 0) === 0) {
        ctx.addIssue({
          path: ["supplyCollateralAmount"],
          code: z.ZodIssueCode.custom,
          message: "Enter an amount",
        });
        return; // avoid duplicate messages
      }

      try {
        const availableToBorrow = computeAvailableToBorrow(market, currentPosition, supplyDelta, 0);
        const borrowRaw = parseUnits(borrowStr, market.loanAsset.decimals);
        const maxBorrowRaw = parseUnits(availableToBorrow.toString(), market.loanAsset.decimals);

        if (borrowRaw > maxBorrowRaw) {
          ctx.addIssue({
            path: ["borrowAmount"],
            code: z.ZodIssueCode.custom,
            message: "Borrow would make position unhealthy",
          });
        }
      } catch {
        // If computation fails, do not block user with a schema error
      }
    });
}

export function createMarketRepayAndWithdrawCollateralFormSchema(params: {
  market: MarketNonIdle;
  currentPosition?: MarketPosition;
  loanAsset: { decimals: number };
  positionBorrowAmountRaw?: bigint;
  collateralAsset: { decimals: number };
}) {
  const { market, currentPosition } = params;

  return z
    .object({
      repayAmount: createOnchainAmountSchema({
        decimals: params.loanAsset.decimals,
        maxAmount: params.positionBorrowAmountRaw ?? 0n,
      }),
      isMaxRepay: z.boolean(),
      withdrawCollateralAmount: createOnchainAmountSchema(),
      isMaxWithdrawCollateral: z.boolean(),
    })
    .superRefine((values, ctx) => {
      if (!currentPosition) return; // can't validate without position context

      const repayStr = values.repayAmount === "" ? "0" : values.repayAmount;
      const withdrawStr = values.withdrawCollateralAmount === "" ? "0" : values.withdrawCollateralAmount;

      const repayAmountNum = Number(repayStr);

      // Require at least one of the fields to be > 0
      if ((Number(repayStr) || 0) === 0 && (Number(withdrawStr) || 0) === 0) {
        ctx.addIssue({
          path: ["repayAmount"],
          code: z.ZodIssueCode.custom,
          message: "Enter an amount",
        });
        return; // avoid duplicate messages
      }

      try {
        const maxWithdraw = computeMarketMaxWithdrawCollateral(market, currentPosition, repayAmountNum);
        const withdrawRaw = parseUnits(withdrawStr, params.collateralAsset.decimals);
        const maxWithdrawRaw = parseUnits(maxWithdraw.toString(), params.collateralAsset.decimals);

        if (withdrawRaw > maxWithdrawRaw) {
          ctx.addIssue({
            path: ["withdrawCollateralAmount"],
            code: z.ZodIssueCode.custom,
            message: "Withdraw would make position unhealthy",
          });
        }
      } catch {
        // If computation fails, do not block user with a schema error
      }
    });
}
