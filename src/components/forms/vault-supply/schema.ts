import { z } from "zod";
import { createOnchainAmountSchema } from "@/utils/schemas";

export function createVaultSupplyFormSchema(decimals: number, accountLoanTokenBalance?: bigint) {
  return z.object({
    supplyAmount: createOnchainAmountSchema({
      decimals,
      max: accountLoanTokenBalance,
      maxErrorMessage: "Amount exceeds balance.",
    }),
    isMaxSupply: z.boolean(),
  });
}

export type VaultSupplyFormSchemaInput = z.input<ReturnType<typeof createVaultSupplyFormSchema>>;
export type VaultSupplyFormSchemaOutput = z.output<ReturnType<typeof createVaultSupplyFormSchema>>;
