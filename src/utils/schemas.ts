import { formatUnits, maxUint256, parseUnits } from "viem";
import { z } from "zod";

export function parseOnchainAmount(value: string, decimals: number): bigint | null {
  try {
    // parseUnits handles "" and "." as 0n (desired behavior)
    return parseUnits(value.trim(), decimals);
  } catch {
    return null;
  }
}

export function createOnchainAmountSchema({
  decimals,
  min = 1n, // 1n is equivalent to positive (0n is not valid)
  minErrorMessage = min === 1n ? "Amount required" : `Must be greater than ${formatUnits(min, decimals)}.`,
  max = maxUint256,
  maxErrorMessage = `Must be less than ${formatUnits(max, decimals)}.`,
}: {
  decimals: number;
  min?: bigint;
  minErrorMessage?: string;
  max?: bigint;
  maxErrorMessage?: string;
}) {
  return z
    .string()
    .transform((value, ctx) => {
      const parsed = parseOnchainAmount(value, decimals);

      if (parsed === null) {
        ctx.addIssue({
          code: "custom",
          message: "Invalid number",
        });
        return z.NEVER;
      }

      return parsed;
    })
    .pipe(z.bigint().min(min, { message: minErrorMessage }).max(max, { message: maxErrorMessage }));
}
