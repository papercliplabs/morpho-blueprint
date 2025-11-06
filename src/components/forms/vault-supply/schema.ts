import { z } from "zod";
import type { Vault } from "@/data/whisk/getVault";
import { createOnchainAmountSchema } from "@/utils/schemas";
import { computeAvailableBalance, isVaultUnderlyingAssetWrappedNativeAsset } from "./utils";

export function createVaultSupplyFormSchema(
  vault: Vault,
  accountLoanTokenBalance?: bigint,
  accountNativeAssetBalance?: bigint,
  maxFeePerGas?: bigint,
) {
  return z
    .object({
      supplyAmount: createOnchainAmountSchema({
        decimals: vault.asset.decimals,
        // Max computed in superrefine
      }),
      allowNativeAssetWrapping: z.boolean(),
    })
    .superRefine((data, ctx) => {
      const isUnderlyingAssetWrappedNativeAsset = isVaultUnderlyingAssetWrappedNativeAsset(vault);
      const availableBalance = computeAvailableBalance({
        accountLoanTokenBalance,
        accountNativeAssetBalance,
        maxFeePerGas,
        includeNativeAssetWrapping: data.allowNativeAssetWrapping && isUnderlyingAssetWrappedNativeAsset,
      });

      if (availableBalance !== undefined && data.supplyAmount > availableBalance) {
        ctx.addIssue({
          path: ["supplyAmount"],
          code: "custom",
          message: "Amount exceeds balance.",
        });
      }
    });
}

export type VaultSupplyFormSchemaInput = z.input<ReturnType<typeof createVaultSupplyFormSchema>>;
export type VaultSupplyFormSchemaOutput = z.output<ReturnType<typeof createVaultSupplyFormSchema>>;
