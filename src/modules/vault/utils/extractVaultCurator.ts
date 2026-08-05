import type { CuratorInfo } from "@/common/data/types";

export function extractVaultCurator(vault: {
  metadata?: { curator: CuratorInfo | null } | null;
}): CuratorInfo | undefined {
  return vault.metadata?.curator ?? undefined;
}
