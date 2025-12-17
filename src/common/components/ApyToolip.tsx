import { Avatar } from "@/common/components/ui/avatar";
import { Badge } from "@/common/components/ui/badge";
import { Sparkles } from "@/common/components/ui/icons/Sparkles";
import NumberFlow from "@/common/components/ui/number-flow";
import { TooltipPopover, TooltipPopoverContent, TooltipPopoverTrigger } from "@/common/components/ui/tooltip-popover";
import type { TokenInfo } from "@/common/data/fragments";
import { formatNumber } from "@/common/utils/format";
import { APP_CONFIG } from "@/config";

type ApyTooltipType = "borrow" | "earn";

type ApyTooltipContent = {
  title: string;
  description: string;
};

const TOOLTIP_CONTENT: Record<ApyTooltipType, ApyTooltipContent> = {
  borrow: {
    title: "Borrow APY",
    description: "The net annual percent yield (APY) paid by borrowing from this market, including rewards.",
  },
  earn: {
    title: "Earn APY",
    description: "The net annual percent yeild (APY) for the position including rewards.",
  },
};

type ApyTooltipTriggerVariant = "default" | "sm";

type ApyTooltipTriggerProps = {
  totalApy: number;
  showSparkle?: boolean;
  variant?: ApyTooltipTriggerVariant;
  sparkleSide?: "left" | "right";
};

function ApyTooltipTrigger({
  showSparkle = false,
  sparkleSide = "right",
  totalApy,
  variant = "default",
}: ApyTooltipTriggerProps) {
  return variant === "sm" ? (
    <span className="body-medium-plus flex items-center gap-1">
      {showSparkle && sparkleSide === "left" && <Sparkles className="size-4 fill-primary" />}
      {formatNumber(totalApy, { style: "percent" })}
      {showSparkle && sparkleSide === "right" && <Sparkles className="size-4 fill-primary" />}
    </span>
  ) : (
    <div className="flex items-center gap-1">
      {showSparkle && sparkleSide === "left" && <Sparkles className="size-6 fill-primary" />}
      <NumberFlow className="heading-4" value={totalApy} format={{ style: "percent" }} />
      {showSparkle && sparkleSide === "right" && <Sparkles className="size-6 fill-primary" />}
    </div>
  );
}

export type Reward = {
  asset: TokenInfo;
  apr: number;
};

type ApyTooltipContentProps = {
  type: ApyTooltipType;
  nativeApy: number;
  totalApy: number;
  performanceFee?: number;
  rewards?: Reward[];
};

function ApyTooltipContent({ type, totalApy, nativeApy, rewards, performanceFee }: ApyTooltipContentProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <span className="body-medium-plus">{TOOLTIP_CONTENT[type].title}</span>
        <span className="body-small">{TOOLTIP_CONTENT[type].description}</span>
      </div>
      <div className="body-small flex flex-col gap-2">
        <span className="flex justify-between">
          <span>Native APY ({APP_CONFIG.apyWindow})</span>
          <span className="body-small-plus">{formatNumber(nativeApy, { style: "percent" })}</span>
        </span>
        {!!rewards &&
          rewards.map((reward) => {
            return (
              <span key={reward.asset.symbol} className="flex justify-between">
                <span className="flex items-center gap-2">
                  {reward.asset.symbol} <Avatar src={reward.asset.icon} size="xs" />
                </span>
                <span className="body-small-plus">
                  {formatNumber((type === "borrow" ? -1 : 1) * reward.apr, {
                    style: "percent",
                    signDisplay: "exceptZero",
                  })}
                </span>
              </span>
            );
          })}
        {performanceFee !== undefined && (
          <span className="flex justify-between">
            <span className="flex items-center gap-2">
              <span>Performance Fee</span>
              <Badge variant="small">
                {formatNumber(nativeApy !== 0 ? performanceFee / nativeApy : 0, {
                  style: "percent",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 1,
                })}
              </Badge>
            </span>
            <span className="body-small-plus">
              {formatNumber((type === "borrow" ? 1 : -1) * performanceFee, {
                style: "percent",
                signDisplay: "exceptZero",
              })}
            </span>
          </span>
        )}
      </div>
      <div className="h-[1px] bg-border" />
      <div className="flex justify-between">
        <span>Total APY</span>
        <span className="font-semibold">
          = {formatNumber(totalApy, { style: "percent", signDisplay: "exceptZero" })}
        </span>
      </div>
    </div>
  );
}

type ApyTooltipProps = {
  triggerVariant?: ApyTooltipTriggerVariant;
  sparkleSide?: "left" | "right";
} & ApyTooltipContentProps;

function ApyTooltip({
  nativeApy,
  performanceFee,
  rewards,
  sparkleSide = "right",
  totalApy,
  type,
  triggerVariant = "default",
}: ApyTooltipProps) {
  return (
    <TooltipPopover>
      <TooltipPopoverTrigger>
        <ApyTooltipTrigger
          showSparkle={!!rewards && rewards.length > 0}
          sparkleSide={sparkleSide}
          totalApy={totalApy}
          variant={triggerVariant}
        />
      </TooltipPopoverTrigger>
      <TooltipPopoverContent>
        <ApyTooltipContent
          nativeApy={nativeApy}
          performanceFee={performanceFee}
          rewards={rewards}
          totalApy={totalApy}
          type={type}
        />
      </TooltipPopoverContent>
    </TooltipPopover>
  );
}

export { ApyTooltip, ApyTooltipContent, ApyTooltipTrigger };
