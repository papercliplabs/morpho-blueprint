import { DataChart } from "@/components/DataChart/DataChart";
import { APP_CONFIG } from "@/config";
import type { Vault } from "@/data/whisk/getVault";

interface VaultHistoricalApyChartProps {
  vaultPromise: Promise<Vault>;
}

export async function VaultHistoricalApyChart({ vaultPromise }: VaultHistoricalApyChartProps) {
  const vault = await vaultPromise;

  if (!vault || !("historical" in vault) || !vault.historical) {
    return null;
  }

  const key = `supplyApy${APP_CONFIG.apyWindow}` as const;

  return (
    <DataChart
      data={vault.historical}
      title={`Native APY (${APP_CONFIG.apyWindow})`}
      defaultTab={key}
      tabOptions={[
        {
          type: "apy",
          key,
          description: `Native supply APY (exluding rewards and fees).`,
          title: `APY (${APP_CONFIG.apyWindow})`,
          baseApy: vault.apy.base,
          totalApy: vault.apy.total,
        },
      ]}
    />
  );
}
