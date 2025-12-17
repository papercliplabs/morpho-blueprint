import { clsx } from "clsx";

import type { MarketAction, MarketPositionChange } from "@/actions";
import { MetricChange, MetricChangeValues } from "@/common/components/MetricChange";
import { NumberFlowWithLoading } from "@/common/components/ui/number-flow";
import { Skeleton } from "@/common/components/ui/skeleton";
import { descaleBigIntToNumber, formatNumber } from "@/common/utils/format";
import type { Market, MarketNonIdle } from "@/modules/market/data/getMarket";
import { AssetChangeSummary } from "@/modules/token/components/AssetChangeSummary";

import { ActionFlow, type ActionFlowProps } from "./ActionFlow";

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

  if (!action) {
    return basePayload;
  }

  const collateralDelta = action.positionChange.collateral.after - action.positionChange.collateral.before;
  const loanDelta = action.positionChange.loan.after - action.positionChange.loan.before;
  return {
    ...basePayload,
    collateralAmount: Math.abs(descaleBigIntToNumber(collateralDelta, market.collateralAsset?.decimals ?? 18)),
    loanAmount: Math.abs(descaleBigIntToNumber(loanDelta, market.loanAsset.decimals)),
  };
}

export function MarketActionSummary({
  market,
  positionChange,
}: {
  market: MarketNonIdle;
  positionChange: MarketPositionChange;
}) {
  const collateralDeltaAmountRaw = positionChange.collateral.after - positionChange.collateral.before;
  const collateralDeltaAmount = descaleBigIntToNumber(collateralDeltaAmountRaw, market.collateralAsset.decimals);
  const collateralDeltaAmountUsd = collateralDeltaAmount * (market.collateralAsset.priceUsd ?? 0);
  const collateralAction = collateralDeltaAmount > 0 ? "Add" : "Withdraw";

  const loanDeltaAmountRaw = positionChange.loan.after - positionChange.loan.before;
  const loanDeltaAmount = descaleBigIntToNumber(loanDeltaAmountRaw, market.loanAsset.decimals);
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
          className="gap-1"
          initialValue={
            <NumberFlowWithLoading
              value={descaleBigIntToNumber(positionChange.collateral.before, market.collateralAsset.decimals)}
              isLoading={isLoading}
              loadingContent={<Skeleton className="h-[21px] w-8" />}
            />
          }
          finalValue={
            positionChange.collateral.after === positionChange.collateral.before ? undefined : (
              <NumberFlowWithLoading
                value={descaleBigIntToNumber(positionChange.collateral.after, market.collateralAsset.decimals)}
                isLoading={isLoading}
                loadingContent={<Skeleton className="h-[21px] w-8" />}
              />
            )
          }
        />
      )}
      <MetricChange
        name={`Loan (${market.loanAsset?.symbol})`}
        className="gap-1"
        initialValue={
          <NumberFlowWithLoading
            value={descaleBigIntToNumber(positionChange.loan.before, market.loanAsset.decimals)}
            isLoading={isLoading}
            loadingContent={<Skeleton className="h-[21px] w-8" />}
          />
        }
        finalValue={
          positionChange.loan.after === positionChange.loan.before ? undefined : (
            <NumberFlowWithLoading
              value={descaleBigIntToNumber(positionChange.loan.after, market.loanAsset.decimals)}
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
            value={descaleBigIntToNumber(positionChange.availableToBorrow.before, market.loanAsset.decimals)}
            isLoading={isLoading}
            loadingContent={<Skeleton className="h-[21px] w-8" />}
          />
        }
        finalValue={
          positionChange.availableToBorrow.after === positionChange.availableToBorrow.before ? undefined : (
            <NumberFlowWithLoading
              value={descaleBigIntToNumber(positionChange.availableToBorrow.after, market.loanAsset.decimals)}
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
                  value={descaleBigIntToNumber(positionChange.ltv.before, 18)}
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
                    value={descaleBigIntToNumber(positionChange.ltv.after, 18)}
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
    collateralDelta === 0n ? "" : collateralDelta > 0n ? "Supply Collateral" : "Withdraw Collateral";
  const loanActionName = loanDelta === 0n ? "" : loanDelta > 0n ? "Borrow" : "Repay";

  const middleCopy = collateralActionName !== "" && loanActionName !== "" ? " and " : "";
  const actionName =
    loanDelta > 0n
      ? collateralActionName + middleCopy + loanActionName
      : loanActionName + middleCopy + collateralActionName;

  return actionName;
}
