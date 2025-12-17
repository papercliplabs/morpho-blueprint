import type { VaultAction, VaultPositionChange } from "@/actions";
import { ApyTooltip } from "@/common/components/ApyToolip";
import { MetricChange } from "@/common/components/MetricChange";
import { NumberFlowWithLoading } from "@/common/components/ui/number-flow";
import { Skeleton } from "@/common/components/ui/skeleton";
import { descaleBigIntToNumber } from "@/common/utils/format";
import { ActionFlow, type ActionFlowProps } from "@/modules/action-flow/components/ActionFlow";
import { AssetChangeSummary } from "@/modules/token/components/AssetChangeSummary";
import type { Vault } from "@/modules/vault/data/getVault";

export function VaultActionFlow({
  vault,
  action,
  trackingTag,
  ...props
}: Omit<ActionFlowProps, "summary" | "metrics" | "chainId" | "actionName" | "trackingPayload"> & {
  action: VaultAction | null;
  vault: Vault;
  trackingTag: string;
}) {
  return (
    <ActionFlow
      action={action}
      summary={action && <VaultActionSummary vault={vault} positionChange={action.positionChange} />}
      metrics={action && <VaultActionSimulationMetrics vault={vault} positionChange={action.positionChange} />}
      actionName={action ? vaultPositionChangeToActionName(action.positionChange) : "Send Transaction"} // Fallback won't occur
      trackingPayload={getTrackingPayload(vault, action, trackingTag)}
      {...props}
    />
  );
}

function getTrackingPayload(vault: Vault, action: VaultAction | null, tag: string) {
  const basePayload = {
    tag,
    vaultAddress: vault.vaultAddress,
  };

  if (!action) {
    return basePayload;
  }

  const delta = action.positionChange.balance.after - action.positionChange.balance.before;
  return {
    ...basePayload,
    amount: Math.abs(descaleBigIntToNumber(delta, vault.asset.decimals)),
  };
}

export function VaultActionSummary({ vault, positionChange }: { vault: Vault; positionChange: VaultPositionChange }) {
  const deltaAmountRaw = positionChange.balance.after - positionChange.balance.before;
  const deltaAmount = descaleBigIntToNumber(deltaAmountRaw, vault.asset.decimals);
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
            value={descaleBigIntToNumber(positionChange.balance.before, vault.asset.decimals)}
            isLoading={isLoading}
            loadingContent={<Skeleton className="h-[21px] w-8" />}
          />
        }
        finalValue={
          positionChange.balance.after === positionChange.balance.before ? undefined : (
            <NumberFlowWithLoading
              value={descaleBigIntToNumber(positionChange.balance.after, vault.asset.decimals)}
              isLoading={isLoading}
              loadingContent={<Skeleton className="h-[21px] w-8" />}
            />
          )
        }
      />
      <MetricChange
        name="APY"
        initialValue={
          <ApyTooltip
            type="earn"
            nativeApy={vault.apy.base}
            totalApy={vault.apy.total}
            performanceFee={vault.apy.fee}
            rewards={vault.apy.rewards}
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
