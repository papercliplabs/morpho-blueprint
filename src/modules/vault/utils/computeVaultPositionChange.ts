import { MathLib } from "@morpho-org/blue-sdk";
import type { VaultPositionChange } from "@/actions";
import type { VaultPosition } from "@/modules/vault/data/getVaultPositions";

export function computeVaultPositionChange({
  currentPosition,
  supplyAmountChange,
}: {
  currentPosition?: VaultPosition;
  supplyAmountChange: bigint;
}): VaultPositionChange {
  const currentSupply = BigInt(currentPosition?.assets?.raw ?? 0);
  const newSupply = MathLib.max(currentSupply + supplyAmountChange, 0n);

  return {
    balance: {
      before: currentSupply,
      after: newSupply,
    },
  };
}
