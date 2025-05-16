import { MarketPositionChange } from "@/actions/utils/positionChange";
import { MarketAction } from "@/actions/utils/types";
import { Market } from "@/data/whisk/getMarket";
import { formatNumber } from "@/utils/format";

import { AssetChangeSummary } from "../AssetChangeSummary";
import { MetricChange } from "../MetricChange";
import { MetricChangeValues } from "../MetricChange";

import { ActionFlow, ActionFlowProps } from ".";

export function MarketActionFlowDialog({
  market,
  action,
  ...props
}: Omit<ActionFlowProps, "summary" | "metrics"> & { market: Market; action: MarketAction }) {
  return (
    <ActionFlow
      summary={<MarketActionSummary market={market} positionChange={action.positionChange} />}
      metrics={<MarketActionSimulationMetrics market={market} positionChange={action.positionChange} />}
      action={action}
      {...props}
    />
  );
}

export function MarketActionSummary({
  market,
  positionChange,
}: {
  market: Market;
  positionChange: MarketPositionChange;
}) {
  const collateralDeltaAmount = positionChange.collateral.delta.amount;
  const collateralDeltaAmountUsd = collateralDeltaAmount * (market.collateralAsset?.priceUsd ?? 0);
  const collateralAction = collateralDeltaAmount > 0 ? "Add" : "Withdraw";

  const loanDeltaAmount = positionChange.loan.delta.amount;
  const loanDeltaAmountUsd = loanDeltaAmount * (market.loanAsset?.priceUsd ?? 0);
  const loanAction = loanDeltaAmount > 0 ? "Borrow" : "Repay";

  return (
    <div>
      {market.collateralAsset && (
        <AssetChangeSummary
          amount={collateralDeltaAmount}
          amountUsd={collateralDeltaAmountUsd}
          asset={market.collateralAsset}
          label={`${collateralAction} ${market.collateralAsset.symbol}`}
        />
      )}
      <AssetChangeSummary
        amount={loanDeltaAmount}
        amountUsd={loanDeltaAmountUsd}
        asset={market.loanAsset}
        label={`${loanAction} ${market.loanAsset.symbol}`}
      />
    </div>
  );
}

export function MarketActionSimulationMetrics({
  market,
  positionChange,
}: {
  market: Market;
  positionChange: MarketPositionChange;
}) {
  const collateralAssetPriceUsd = market.collateralAsset?.priceUsd ?? 0;
  const loanAssetPriceUsd = market.loanAsset?.priceUsd ?? 0;
  return (
    <div className="flex w-full flex-col gap-2">
      {market.collateralAsset && (
        <MetricChange
          name={`Collateral (${market.collateralAsset?.symbol})`}
          initialValue={formatNumber(positionChange.collateral.before.amount * collateralAssetPriceUsd)}
          finalValue={formatNumber(positionChange.collateral.after.amount * collateralAssetPriceUsd)}
        />
      )}
      <MetricChange
        name={`Loan (${market.loanAsset?.symbol})`}
        initialValue={formatNumber(positionChange.loan.before.amount * loanAssetPriceUsd)}
        finalValue={formatNumber(positionChange.loan.after.amount * loanAssetPriceUsd)}
      />
      <MetricChange
        name="Available to borrow"
        initialValue={formatNumber(positionChange.availableToBorrow.before.amount * loanAssetPriceUsd)}
        finalValue={formatNumber(positionChange.availableToBorrow.after.amount * loanAssetPriceUsd)}
      />
      <div className="flex items-center justify-between overflow-hidden">
        <span className="body-medium text-secondary-foreground">LTV / LLTV</span>
        (<MetricChangeValues initialValue={positionChange.ltv.before} finalValue={positionChange.ltv.after} />) /{" "}
        {formatNumber(market.lltv, { style: "percent" })}
      </div>
    </div>
  );
}
