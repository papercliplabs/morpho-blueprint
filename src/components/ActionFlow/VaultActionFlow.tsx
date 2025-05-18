import { VaultPositionChange } from "@/actions/utils/positionChange";
import { VaultAction } from "@/actions/utils/types";
import { Vault } from "@/data/whisk/getVault";

import { AssetChangeSummary } from "../AssetChangeSummary";
import { MetricChange } from "../MetricChange";
import { ApyTooltip } from "../Tooltips/ApyToolip";
import { NumberFlowWithLoading } from "../ui/number-flow";
import { Skeleton } from "../ui/skeleton";

import { ActionFlow, ActionFlowProps } from ".";

export function VaultActionFlow({
  vault,
  action,
  ...props
}: Omit<ActionFlowProps, "summary" | "metrics" | "chainId" | "actionName"> & {
  action: VaultAction | null;
  vault: Vault;
}) {
  return (
    <ActionFlow
      action={action}
      chainId={vault.chain.id}
      summary={action && <VaultActionSummary vault={vault} positionChange={action.positionChange} />}
      metrics={action && <VaultActionSimulationMetrics vault={vault} positionChange={action.positionChange} />}
      actionName={action ? vaultPositionChangeToActionName(action.positionChange) : "Send Transaction"} // Fallback won't occur
      {...props}
    />
  );
}

export function VaultActionSummary({ vault, positionChange }: { vault: Vault; positionChange: VaultPositionChange }) {
  const deltaAmount = positionChange.balance.after - positionChange.balance.before;
  const deltaAmountUsd = deltaAmount * (vault.asset?.priceUsd ?? 0);
  const action = deltaAmount > 0 ? "Supply" : "Withdraw";

  return (
    <AssetChangeSummary
      amount={deltaAmount}
      amountUsd={deltaAmountUsd}
      asset={vault.asset}
      label={`${action} ${vault.asset.symbol}`}
    />
  );
}

export function VaultActionSimulationMetrics({
  vault,
  positionChange,
  isLoading = false,
}: {
  vault: Vault;
  positionChange: VaultPositionChange;
  isLoading?: boolean;
}) {
  return (
    <div className="flex w-full flex-col gap-2">
      <MetricChange
        name="Supplied"
        initialValue={
          <NumberFlowWithLoading
            value={positionChange.balance.before}
            isLoading={isLoading}
            loadingContent={<Skeleton className="h-[21px] w-8" />}
          />
        }
        finalValue={
          positionChange.balance.after == positionChange.balance.before ? undefined : (
            <NumberFlowWithLoading
              value={positionChange.balance.after}
              isLoading={isLoading}
              loadingContent={<Skeleton className="h-[21px] w-8" />}
            />
          )
        }
      />
      <MetricChange
        name="Apy"
        initialValue={
          <ApyTooltip
            type="earn"
            nativeApy={vault.supplyApy.base}
            totalApy={vault.supplyApy.total}
            performanceFee={vault.supplyApy.performanceFee}
            rewards={vault.supplyApy.rewards}
            triggerVariant="sm"
            sparkleSide="left"
          />
        }
      />
    </div>
  );
}

function vaultPositionChangeToActionName(positonChange: VaultPositionChange) {
  const positionDelta = positonChange.balance.after - positonChange.balance.before;
  return positionDelta > 0 ? "Supply" : "Withdraw";
}
