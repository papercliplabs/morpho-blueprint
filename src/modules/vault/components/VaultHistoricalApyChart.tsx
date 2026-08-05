import { DataChart } from "@/common/components/DataChart/DataChart";
import { CHART_RANGES, DATA_RANGES, type DataRange } from "@/common/utils/chart-ranges";
import { rateLabel, vaultV2HistoryApyWindow } from "@/common/utils/timeframe";
import { APP_CONFIG } from "@/config";
import type { Vault } from "@/modules/vault/data/getVault";

interface VaultHistoricalApyChartProps {
  vaultPromise: Promise<Vault>;
}

export async function VaultHistoricalApyChart({ vaultPromise }: VaultHistoricalApyChartProps) {
  const vault = await vaultPromise;

  if (!vault || !("historical" in vault) || !vault.historical) {
    return null;
  }

  // Which realized average labels which range comes from the shared range table, so a new range
  // cannot be offered by the selector without an average behind it.
  const averageApy = Object.fromEntries(
    DATA_RANGES.map((range) => [range, vault.apyAverages[CHART_RANGES[range].apyAverageKey]]),
  ) as Record<DataRange, number | null>;

  // This tab carries two differently-sourced numbers: the headline `totalApy`, averaged over the
  // configured window, and the plotted line, whose smoothing the API caps at 24h for a vault V2
  // history point. With a 7d/30d `apyWindow` on a V2 vault those windows diverge, and one label
  // cannot honestly name both — labelling it with the series window mislabels the headline, and
  // vice versa.
  //
  // The label tracks the headline, since that is the number sitting directly against it, and the
  // description discloses the series window when it differs. Vault V1 serves every window natively,
  // and any deployment configured at or under 24h never diverges at all.
  const seriesWindow = vault.__typename === "MorphoVaultV2" ? vaultV2HistoryApyWindow : APP_CONFIG.apyWindow;
  const description =
    seriesWindow === APP_CONFIG.apyWindow
      ? "Net supply APY, after fees and including rewards."
      : `Net supply APY, after fees and including rewards. The headline is averaged over ${APP_CONFIG.apyWindow}; the plotted line is smoothed over ${seriesWindow}, the longest window the API serves for a vault V2 history point.`;

  return (
    <DataChart
      data={vault.historical}
      // Card title names the section, the tab label names the metric — same split as the deposits
      // chart ("Deposits" / "Total Deposits (USDC)"). The window belongs on the label that sits
      // against the number and carries the description tooltip.
      title="APY"
      defaultTab="netApy"
      tabOptions={[
        {
          type: "apy",
          key: "netApy",
          description,
          title: rateLabel("Net APY"),
          totalApy: vault.apy.total,
          averageApy,
        },
      ]}
    />
  );
}
