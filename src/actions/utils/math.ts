import { MathLib, RoundingDirection } from "@morpho-org/blue-sdk";

// Allow 0.03% buffer for max transfers on rebasing tokens
// This gives ~1 day grace period for execution if rebasing at 10% APY, which is useful for multisigs (also aligns with bundler permits).
const TOKEN_REBASEING_FACTOR = 1.0003;

export function computeScaledAmount(
  amount: bigint,
  scalingFactor: number,
  roundingDirection: RoundingDirection = "Down"
) {
  if (scalingFactor == 1) {
    return amount;
  }
  return MathLib.mulDiv(
    amount,
    BigInt(Math.floor(scalingFactor * Number(MathLib.WAD))),
    MathLib.WAD,
    roundingDirection
  );
}

export function computeAmountWithRebasingMargin(amount: bigint) {
  return computeScaledAmount(amount, TOKEN_REBASEING_FACTOR, "Down");
}
