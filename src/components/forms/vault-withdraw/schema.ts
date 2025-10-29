import { z } from "zod";
import { createOnchainAmountSchema } from "@/utils/schemas";

export function createVaultWithdrawFormSchema(decimals: number, accountPositionBalance?: bigint) {
  return z.object({
    withdrawAmount: createOnchainAmountSchema({
      decimals,
      max: accountPositionBalance,
      maxErrorMessage: "Amount exceeds position.",
    }),
    isMaxWithdraw: z.boolean(),
  });
}

export type VaultWithdrawFormSchemaInput = z.input<ReturnType<typeof createVaultWithdrawFormSchema>>;
export type VaultWithdrawFormSchemaOutput = z.output<ReturnType<typeof createVaultWithdrawFormSchema>>;
