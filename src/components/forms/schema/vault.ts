import { z } from "zod";
import { createOnchainAmountSchema } from "./onchain-amount";

export function createVaultSupplyFormSchema(vault: {
  asset: { decimals: number };
  walletUnderlyingAssetBalanceRaw?: bigint;
}) {
  return z.object({
    supplyAmount: createOnchainAmountSchema({
      decimals: vault.asset.decimals,
      maxAmount: vault.walletUnderlyingAssetBalanceRaw ?? 0n,
    }),
    isMaxSupply: z.boolean(),
  });
}

export function createVaultWithdrawFormSchema(vault: { asset: { decimals: number }; positionBalanceRaw?: bigint }) {
  return z.object({
    withdrawAmount: createOnchainAmountSchema({
      decimals: vault.asset.decimals,
      maxAmount: vault.positionBalanceRaw ?? 0n,
    }),
    isMaxWithdraw: z.boolean(),
  });
}
