import type { ReactNode } from "react";
import { getAddress } from "viem";

import { LinkExternalBlockExplorer } from "@/common/components/LinkExternal";
import { MetricWithTooltip } from "@/common/components/Metric";
import NumberFlow from "@/common/components/ui/number-flow";
import { Skeleton } from "@/common/components/ui/skeleton";
import { formatNumber } from "@/common/utils/format";
import type { Market } from "@/modules/market/data/getMarket";
import { TokenIcon } from "@/modules/token/components/TokenIcon";

interface MarketInfoProps {
  market: Market;
}

export function MarketInfo({ market }: MarketInfoProps) {
  return (
    <MarketInfoLayout
      lltv={<NumberFlow value={Number(market.lltv.formatted)} format={{ style: "percent" }} className="heading-6" />}
      liquidationPenality={
        <NumberFlow value={market.liquidationPenalty} format={{ style: "percent" }} className="heading-6" />
      }
      oracleAddress={
        <LinkExternalBlockExplorer
          chainId={market.chain.id}
          type="address"
          address={market.oracleAddress ? getAddress(market.oracleAddress) : undefined}
          className="heading-6"
        />
      }
      collateralAsset={
        market.collateralAsset ? (
          <LinkExternalBlockExplorer
            chainId={market.chain.id}
            type="address"
            address={getAddress(market.collateralAsset.address)}
            className="heading-6"
          >
            <TokenIcon token={market.collateralAsset} chain={market.chain} chainClassName="border-card" size="sm" />
            <p className="truncate">{market.collateralAsset.symbol}</p>
          </LinkExternalBlockExplorer>
        ) : (
          "None"
        )
      }
      loanAsset={
        <LinkExternalBlockExplorer
          chainId={market.chain.id}
          type="address"
          address={getAddress(market.loanAsset.address)}
          className="heading-6"
        >
          <TokenIcon token={market.loanAsset} chain={market.chain} chainClassName="border-card" size="sm" />
          <p className="truncate">{market.loanAsset.symbol}</p>
        </LinkExternalBlockExplorer>
      }
      oraclePrice={
        <div className="heading-6 flex min-w-0 flex-wrap gap-1">
          <p>1</p>
          <p className="truncate">{market.collateralAsset?.symbol}</p>
          <p>=</p>
          <p>{formatNumber(Number(market.collateralPriceInLoanAsset?.formatted ?? 0))}</p>
          <p className="truncate">{market.loanAsset.symbol}</p>
        </div>
      }
    />
  );
}

export function MarketInfoSkeleton() {
  const metricSkeleton = <Skeleton className="mt-0.5 h-[28px] w-[140px]" />;
  return (
    <MarketInfoLayout
      lltv={metricSkeleton}
      liquidationPenality={metricSkeleton}
      oracleAddress={metricSkeleton}
      collateralAsset={metricSkeleton}
      loanAsset={metricSkeleton}
      oraclePrice={metricSkeleton}
    />
  );
}

interface VaultInfoLayoutProps {
  lltv: ReactNode;
  liquidationPenality: ReactNode;
  oracleAddress: ReactNode;
  collateralAsset: ReactNode;
  loanAsset: ReactNode;
  oraclePrice: ReactNode;
}

function MarketInfoLayout({
  lltv,
  liquidationPenality,
  oracleAddress,
  collateralAsset,
  loanAsset,
  oraclePrice,
}: VaultInfoLayoutProps) {
  return (
    <div className="grid grid-cols-1 gap-6 gap-y-6 md:grid-cols-3 md:gap-y-10">
      <MetricWithTooltip
        label="LLTV"
        tooltip="The liquidation loan-to-value (LLTV) threshold sets the limit at which positions become eligible for liquidation."
      >
        {lltv}
      </MetricWithTooltip>
      <MetricWithTooltip
        label="Liquidation Penality"
        tooltip="The penalty incurred by borrowers upon liquidation, designed to incentivize liquidators."
      >
        {liquidationPenality}
      </MetricWithTooltip>
      <MetricWithTooltip
        label="Oracle Address"
        tooltip="The address of the oracle contract used to price the collateral asset."
      >
        {oracleAddress}
      </MetricWithTooltip>
      <MetricWithTooltip
        label="Collateral Asset"
        tooltip="The collateral asset of the market that can be used to borrow against."
      >
        {collateralAsset}
      </MetricWithTooltip>
      <MetricWithTooltip label="Loan Asset" tooltip="The loan asset of the market that can be borrowed.">
        {loanAsset}
      </MetricWithTooltip>
      <MetricWithTooltip label="Oracle Price" tooltip="The current price from the markets oracle.">
        {oraclePrice}
      </MetricWithTooltip>
    </div>
  );
}
