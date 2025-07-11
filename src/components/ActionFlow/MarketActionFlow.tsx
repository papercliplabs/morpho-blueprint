import { clsx } from "clsx";

import type { MarketAction, MarketPositionChange } from "@/actions";
import type { Market, MarketNonIdle } from "@/data/whisk/getMarket";
import { formatNumber } from "@/utils/format";

import { AssetChangeSummary } from "../AssetChangeSummary";
import { MetricChange, MetricChangeValues } from "../MetricChange";
import { NumberFlowWithLoading } from "../ui/number-flow";
import { Skeleton } from "../ui/skeleton";

import { ActionFlow, type ActionFlowProps } from ".";

export function MarketActionFlow({
  market,
  action,
  trackingTag,
  ...props
}: Omit<ActionFlowProps, "summary" | "metrics" | "chainId" | "actionName" | "trackingPayload"> & {
  market: MarketNonIdle;
  action: MarketAction | null;
  trackingTag: string;
}) {
  return (
    <ActionFlow
      action={action}
      chainId={market.chain.id}
      summary={action && <MarketActionSummary market={market} positionChange={action.positionChange} />}
      metrics={action && <MarketActionSimulationMetrics market={market} positionChange={action.positionChange} />}
      actionName={action ? marketPositionChangeToActionName(action.positionChange) : "Send Transaction"} // Fallback won't occur
      trackingPayload={getTrackingPayload(market, action, trackingTag)}
      {...props}
    />
  );
}

function getTrackingPayload(market: Market, action: MarketAction | null, tag: string) {
  const basePayload = {
    tag,
    marketId: market.marketId,
  };

  if (!action || action.status !== "success") {
    return basePayload;
  }

  const collateralDelta = action.positionChange.collateral.after - action.positionChange.collateral.before;
  const loanDelta = action.positionChange.loan.after - action.positionChange.loan.before;
  return {
    ...basePayload,
    collateralAmount: Math.abs(collateralDelta),
    loanAmount: Math.abs(loanDelta),
  };
}

export function MarketActionSummary({
  market,
  positionChange,
}: {
  market: MarketNonIdle;
  positionChange: MarketPositionChange;
}) {
  const collateralDeltaAmount = positionChange.collateral.after - positionChange.collateral.before;
  const collateralDeltaAmountUsd = collateralDeltaAmount * (market.collateralAsset.priceUsd ?? 0);
  const collateralAction = collateralDeltaAmount > 0 ? "Add" : "Withdraw";

  const loanDeltaAmount = positionChange.loan.after - positionChange.loan.before;
  const loanDeltaAmountUsd = loanDeltaAmount * (market.loanAsset?.priceUsd ?? 0);
  const loanAction = loanDeltaAmount > 0 ? "Borrow" : "Repay";

  return (
    <div className={clsx("flex gap-1", loanDeltaAmount > 0 ? "flex-col" : "flex-col-reverse")}>
      {collateralDeltaAmount !== 0 && (
        <AssetChangeSummary
          amount={collateralDeltaAmount}
          amountUsd={collateralDeltaAmountUsd}
          asset={market.collateralAsset}
          label={`${collateralAction} ${market.collateralAsset.symbol}`}
        />
      )}
      {loanDeltaAmount !== 0 && (
        <AssetChangeSummary
          amount={loanDeltaAmount}
          amountUsd={loanDeltaAmountUsd}
          asset={market.loanAsset}
          label={`${loanAction} ${market.loanAsset.symbol}`}
        />
      )}
    </div>
  );
}

export function MarketActionSimulationMetrics({
  market,
  positionChange,
  isLoading = false,
}: {
  market: Market;
  positionChange: MarketPositionChange;
  isLoading?: boolean;
}) {
  return (
    <div className="flex w-full flex-col gap-2">
      {market.collateralAsset && (
        <MetricChange
          name={`Collateral (${market.collateralAsset?.symbol})`}
          initialValue={
            <NumberFlowWithLoading
              value={positionChange.collateral.before}
              isLoading={isLoading}
              loadingContent={<Skeleton className="h-[21px] w-8" />}
            />
          }
          finalValue={
            positionChange.collateral.after === positionChange.collateral.before ? undefined : (
              <NumberFlowWithLoading
                value={positionChange.collateral.after}
                isLoading={isLoading}
                loadingContent={<Skeleton className="h-[21px] w-8" />}
              />
            )
          }
        />
      )}
      <MetricChange
        name={`Loan (${market.loanAsset?.symbol})`}
        initialValue={
          <NumberFlowWithLoading
            value={positionChange.loan.before}
            isLoading={isLoading}
            loadingContent={<Skeleton className="h-[21px] w-8" />}
          />
        }
        finalValue={
          positionChange.loan.after === positionChange.loan.before ? undefined : (
            <NumberFlowWithLoading
              value={positionChange.loan.after}
              isLoading={isLoading}
              loadingContent={<Skeleton className="h-[21px] w-8" />}
            />
          )
        }
      />
      <MetricChange
        name="Available to borrow"
        initialValue={
          <NumberFlowWithLoading
            value={positionChange.availableToBorrow.before}
            isLoading={isLoading}
            loadingContent={<Skeleton className="h-[21px] w-8" />}
          />
        }
        finalValue={
          positionChange.availableToBorrow.after === positionChange.availableToBorrow.before ? undefined : (
            <NumberFlowWithLoading
              value={positionChange.availableToBorrow.after}
              isLoading={isLoading}
              loadingContent={<Skeleton className="h-[21px] w-8" />}
            />
          )
        }
      />
      <div className="flex items-center justify-between overflow-hidden">
        <span className="body-medium text-muted-foreground">LTV / LLTV</span>
        <div className="body-medium-plus inline-flex whitespace-pre-wrap text-card-foreground">
          <MetricChangeValues
            initialValue={
              <div className="inline-flex">
                {positionChange.ltv.after !== positionChange.ltv.before && "("}
                <NumberFlowWithLoading
                  value={positionChange.ltv.before}
                  isLoading={isLoading}
                  format={{ style: "percent" }}
                  loadingContent={<Skeleton className="h-[21px] w-8" />}
                />
              </div>
            }
            finalValue={
              positionChange.ltv.after === positionChange.ltv.before ? undefined : (
                <div className="inline-flex">
                  <NumberFlowWithLoading
                    value={positionChange.ltv.after}
                    isLoading={isLoading}
                    format={{ style: "percent" }}
                    loadingContent={<Skeleton className="h-[21px] w-8" />}
                  />
                  )
                </div>
              )
            }
          />{" "}
          / {formatNumber(Number(market.lltv.formatted), { style: "percent" })}
        </div>
      </div>
    </div>
  );
}

function marketPositionChangeToActionName(positonChange: MarketPositionChange) {
  const collateralDelta = positonChange.collateral.after - positonChange.collateral.before;
  const loanDelta = positonChange.loan.after - positonChange.loan.before;
  const collateralActionName =
    collateralDelta === 0 ? "" : collateralDelta > 0 ? "Supply Collateral" : "Withdraw Collateral";
  const loanActionName = loanDelta === 0 ? "" : loanDelta > 0 ? "Borrow" : "Repay";

  const middleCopy = collateralActionName !== "" && loanActionName !== "" ? " and " : "";
  const actionName =
    loanDelta > 0
      ? collateralActionName + middleCopy + loanActionName
      : loanActionName + middleCopy + collateralActionName;

  return actionName;
}
