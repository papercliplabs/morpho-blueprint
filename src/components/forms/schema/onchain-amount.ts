import { parseUnits } from "viem";
import { z } from "zod";

export function createOnchainAmountSchema(options?: { decimals: number; maxAmount?: bigint }) {
  const base = z
    .string()
    .pipe(z.coerce.number().nonnegative({ message: "Amount must be >=0" }))
    .pipe(z.coerce.string());

  if (options) {
    return base.refine((value) => {
      if (options.maxAmount === undefined) return true;
      return parseUnits(value, options.decimals) <= options.maxAmount;
    }, "Exceeds max amount");
  }

  return base;
}
