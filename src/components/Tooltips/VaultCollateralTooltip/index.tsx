import AvatarGroup from "@/components/AvatarGroup";
import { Avatar } from "@/components/ui/avatar";
import PercentRing from "@/components/ui/icons/PercentRing";
import { TooltipPopover, TooltipPopoverContent, TooltipPopoverTrigger } from "@/components/ui/tooltip-popover";
import type { VaultSummary } from "@/data/whisk/getVaultSummaries";
import { formatNumber } from "@/utils/format";
import { getVaultCollateral } from "@/utils/vault";

interface VaultCollateralTooltipProps {
  vaultSummary: VaultSummary;
}

export function VaultCollateralTooltip({ vaultSummary }: VaultCollateralTooltipProps) {
  const collaterals = getVaultCollateral(vaultSummary);

  return (
    <TooltipPopover>
      <TooltipPopoverTrigger>
        <AvatarGroup
          avatars={collaterals.map(({ icon, name }) => ({ src: icon, alt: name }))}
          max={4}
          size="sm"
          avatarClassName="border-[var(--row-color)]"
        />
      </TooltipPopoverTrigger>
      <TooltipPopoverContent className="scrollbar-none max-h-[220px] w-[320px] overflow-y-auto">
        <div className="flex flex-col gap-2">
          {collaterals.map((collateral, index) => (
            <div key={`${index}:${collateral.symbol}`} className="flex w-full items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Avatar src={collateral.icon} size="sm" className="rounded-full border" />
                <span className="body-medium-plus max-w-[100px] truncate">{collateral.symbol}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="body-medium-plus">{formatNumber(collateral.supplyUsd, { currency: "USD" })}</span>
                <PercentRing percent={collateral.vaultSupplyShare} />
              </div>
            </div>
          ))}
        </div>
      </TooltipPopoverContent>
    </TooltipPopover>
  );
}
