import { Metric } from "@/components/Metric";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "@/components/ui/icons/Sparkles";
import NumberFlow from "@/components/ui/number-flow";
import { TooltipPopover, TooltipPopoverContent, TooltipPopoverTrigger } from "@/components/ui/tooltip-popover";
import { TokenInfo } from "@/data/whisk/fragments";
import { formatNumber } from "@/utils/format";

type ApyTooltipType = "borrow" | "earn";

type ApyTooltipContent = {
  title: string;
  description: string;
};

const TOOLTIP_CONTENT: Record<ApyTooltipType, ApyTooltipContent> = {
  borrow: {
    title: "Borrow APY",
    description: "Lorem ipsum",
  },
  earn: {
    title: "Earn APY",
    description: "The net annual percent yeild (APY) for the position including rewards.",
  },
};

type ApyTooltipTriggerVariant = "default" | "sm";

type ApyTooltipTriggerProps = {
  type: ApyTooltipType;
  totalApy: number;
  showSparkle?: boolean;
  variant: ApyTooltipTriggerVariant;
  sparkleSide?: "left" | "right";
};

function ApyTooltipTrigger({
  showSparkle = false,
  sparkleSide = "right",
  type,
  totalApy,
  variant,
}: ApyTooltipTriggerProps) {
  return variant == "sm" ? (
    <span className="body-medium-plus flex items-center gap-1">
      {showSparkle && sparkleSide === "left" && <Sparkles className="fill-primary size-4" />}
      {formatNumber(totalApy, { style: "percent" })}
      {showSparkle && sparkleSide === "right" && <Sparkles className="fill-primary size-4" />}
    </span>
  ) : (
    <Metric label={TOOLTIP_CONTENT[type].title}>
      <div className="flex items-center gap-1">
        {showSparkle && sparkleSide === "left" && <Sparkles className="fill-primary size-6" />}
        <NumberFlow className="heading-4" value={totalApy} format={{ style: "percent" }} />
        {showSparkle && sparkleSide === "right" && <Sparkles className="fill-primary size-6" />}
      </div>
    </Metric>
  );
}

type Reward = {
  apr: number;
} & TokenInfo;

type ApyTooltipContentProps = {
  type: ApyTooltipType;
  nativeApy: number;
  totalApy: number;
  performanceFee: number;
  rewards?: Reward[];
};

function ApyTooltipContent({ type, totalApy, nativeApy, rewards, performanceFee }: ApyTooltipContentProps) {
  return (
    <div className="flex w-[300px] flex-col gap-4">
      <div className="flex flex-col gap-3">
        <span className="body-medium-plus">{TOOLTIP_CONTENT[type].title}</span>
        <span className="body-small">{TOOLTIP_CONTENT[type].description}</span>
      </div>
      <div className="body-small flex flex-col gap-2">
        <span className="flex justify-between">
          <span>Native APY</span>
          <span className="body-small-plus">{formatNumber(nativeApy, { style: "percent" })} </span>
        </span>
        {!!rewards &&
          rewards.map((reward) => {
            return (
              <span key={reward.symbol} className="flex justify-between">
                <span className="flex items-center gap-2">
                  {reward.symbol} <Avatar src={reward.icon} fallback={reward.symbol} size="xs" />
                </span>
                {formatNumber(reward.apr, { style: "percent", signDisplay: "exceptZero" })}
              </span>
            );
          })}
        <span className="flex justify-between">
          <span className="flex items-center gap-2">
            <span>Performance Fee</span>
            <Badge variant="small">
              {formatNumber(nativeApy > 0 ? performanceFee / nativeApy : 0, {
                style: "percent",
                minimumFractionDigits: 0,
                maximumFractionDigits: 1,
              })}
            </Badge>
          </span>
          <span className="body-small-plus">
            {formatNumber(performanceFee, { style: "percent", signDisplay: "exceptZero" })}{" "}
          </span>
        </span>
      </div>
      <div className="bg-border h-[1px]" />
      <div className="flex justify-between">
        <span>Total APY</span>
        <span>= {formatNumber(totalApy, { style: "percent", signDisplay: "exceptZero" })}</span>
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
          type={type}
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
