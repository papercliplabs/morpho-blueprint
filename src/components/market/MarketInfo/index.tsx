import { ReactNode } from "react";
import { getAddress } from "viem";

import { LinkExternalBlockExplorer } from "@/components/LinkExternal";
import { MetricWithTooltip } from "@/components/Metric";
import { TokenIcon } from "@/components/TokenIcon";
import NumberFlow from "@/components/ui/number-flow";
import { Skeleton } from "@/components/ui/skeleton";
import { Market } from "@/data/whisk/getMarket";
import { formatNumber } from "@/utils/format";

interface MarketInfoProps {
  market: Market;
}

export function MarketInfo({ market }: MarketInfoProps) {
  return (
    <MarketInfoLayout
      lltv={<NumberFlow value={market.lltv} format={{ style: "percent" }} className="heading-6" />}
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
            <TokenIcon token={market.collateralAsset} chain={market.chain} size="sm" />
            {market.collateralAsset.symbol}
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
          <TokenIcon token={market.loanAsset} chain={market.chain} size="sm" />
          {market.loanAsset.symbol}
        </LinkExternalBlockExplorer>
      }
      oraclePrice={
        <div className="heading-6">
          {`1 ${market.collateralAsset?.symbol} = ${formatNumber(market.collateralPriceInLoanAsset)} ${market.loanAsset.symbol}`}
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
    <div className="flex flex-col gap-4 md:gap-10">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
    </div>
  );
}
