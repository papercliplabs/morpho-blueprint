import AvatarGroup from "@/components/AvatarGroup";
import { Avatar } from "@/components/ui/avatar";
import PercentRing from "@/components/ui/icons/PercentRing";
import { TooltipPopover, TooltipPopoverContent, TooltipPopoverTrigger } from "@/components/ui/tooltip-popover";
import type { VaultSummary } from "@/data/whisk/getVaultSummaries";
import { formatNumber } from "@/utils/format";

export const VaultCollateralTooltipTrigger = ({ vaultSummary }: VaultCollateralTooltipProps) => {
  return (
    <AvatarGroup
      avatars={vaultSummary.marketAllocations
        .filter((allocation) => allocation.market.collateralAsset)
        .reduce(
          (unique, allocation) => {
            const icon = allocation.market.collateralAsset!.icon;
            if (!unique.some((item) => item.src === icon)) {
              unique.push({ src: icon ?? "" });
            }
            return unique;
          },
          [] as { src: string }[],
        )}
      max={4}
      size="sm"
      avatarClassName="border-[var(--row-color)]"
    />
  );
};

export function VaultCollateralTooltipContent({ vaultSummary }: VaultCollateralTooltipProps) {
  return (
    <div className="flex flex-col gap-2">
      {vaultSummary.marketAllocations
        .sort((a, b) => {
          const usageA = getUsage(a);
          const usageB = getUsage(b);
          return usageB - usageA;
        })
        .map((allocation, index) => {
          if (!allocation.market.collateralAsset?.symbol) return null;

          const usage = getUsage(allocation);

          return (
            <div
              key={`${index}:${vaultSummary.vaultAddress}`}
              className="flex w-full items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                <Avatar src={allocation.market.collateralAsset.icon} size="sm" className="rounded-full border" />
                <span className="body-medium-plus truncate">{allocation.market.collateralAsset.symbol}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="body-medium-plus truncate">{formatNumber(usage, { style: "percent" })}</span>
                <PercentRing percent={usage} />
              </div>
            </div>
          );
        })}
    </div>
  );
}

interface VaultCollateralTooltipProps {
  vaultSummary: VaultSummary;
}

export function VaultCollateralTooltip({ vaultSummary }: VaultCollateralTooltipProps) {
  return (
    <TooltipPopover>
      <TooltipPopoverTrigger>
        <VaultCollateralTooltipTrigger vaultSummary={vaultSummary} />
      </TooltipPopoverTrigger>
      <TooltipPopoverContent className="scrollbar-none max-h-[220px] w-[320px] overflow-y-auto">
        <VaultCollateralTooltipContent vaultSummary={vaultSummary} />
      </TooltipPopoverContent>
    </TooltipPopover>
  );
}

function getUsage(allocation: VaultSummary["marketAllocations"][number]) {
  const supplyCap = allocation.supplyCap?.usd ?? 0;
  const totalSupply = allocation.position.supplyAmount.usd ?? 0;
  return supplyCap ? totalSupply / supplyCap : 0;
}
