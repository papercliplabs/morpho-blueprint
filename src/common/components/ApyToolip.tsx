import { Avatar } from "@/common/components/ui/avatar";
import { Sparkles } from "@/common/components/ui/icons/Sparkles";
import NumberFlow from "@/common/components/ui/number-flow";
import { TooltipPopover, TooltipPopoverContent, TooltipPopoverTrigger } from "@/common/components/ui/tooltip-popover";
import type { TokenInfo } from "@/common/data/types";
import { formatNumber } from "@/common/utils/format";
import { rateLabel } from "@/common/utils/timeframe";

/** `earn` is a vault deposit; `marketSupply` is a single market's supply side inside an allocation table. */
type ApyTooltipType = "borrow" | "earn" | "marketSupply";

type ApyTooltipContent = {
  title: string;
  /** Label for the pre-rewards row; only rendered when the position has rewards. */
  afterFeesLabel: string;
  totalLabel: string;
  description: string;
};

const TOOLTIP_CONTENT: Record<ApyTooltipType, ApyTooltipContent> = {
  borrow: {
    title: rateLabel("Net Rate"),
    // Not "after fees": the market fee is taken from supplier interest, so it never reduces what a
    // borrower pays. Only the vault side has a meaningful after-fees rate.
    afterFeesLabel: "Native Rate",
    totalLabel: "Net Rate",
    description: "The net annual rate paid to borrow from this market, including rewards.",
  },
  earn: {
    title: rateLabel("Net APY"),
    afterFeesLabel: "Vault APY after fees",
    totalLabel: "Net APY",
    description: "The net annual percentage yield for a deposit in this vault, after fees and including rewards.",
  },
  marketSupply: {
    title: rateLabel("Net APY"),
    afterFeesLabel: "Market APY after fees",
    totalLabel: "Net APY",
    description: "The net annual percentage yield for supplying to this market, after fees and including rewards.",
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
  /** Rate after fees, excluding rewards. Only surfaced when there are rewards to break out. */
  apyAfterFees: number;
  totalApy: number;
  rewards?: Reward[];
};

/**
 * Fee rates are deliberately absent: they are already baked into every figure here, so listing them
 * as rows that do not add up to the total is what confused users. The vault info panel shows the
 * performance and management fee rates on their own.
 *
 * With no rewards the breakdown collapses to the total, since `after fees` would just repeat it.
 */
function ApyTooltipContent({ type, totalApy, apyAfterFees, rewards }: ApyTooltipContentProps) {
  const content = TOOLTIP_CONTENT[type];
  const hasRewards = !!rewards && rewards.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <span className="body-medium-plus">{content.title}</span>
        <span className="body-small">{content.description}</span>
      </div>
      {hasRewards && (
        <div className="body-small flex flex-col gap-2">
          <span className="flex justify-between">
            <span>{content.afterFeesLabel}</span>
            <span className="body-small-plus">{formatNumber(apyAfterFees, { style: "percent" })}</span>
          </span>
          {rewards.map((reward) => (
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
          ))}
        </div>
      )}
      {/* Nothing to divide in the collapsed state. */}
      {hasRewards && <div className="h-[1px] bg-border" />}
      <div className="flex justify-between">
        <span>{content.totalLabel}</span>
        {/*
         * No "=" prefix: the rows above are a breakdown, not an equation. Reward APRs are current
         * while the rate above them is windowed, so they need not close the gap exactly — and
         * `total` falls back to `afterFees` when the API returns no net figure. Asserting a sum
         * that can visibly fail to add up is the confusion this layout exists to remove.
         */}
        <span className="font-semibold">{formatNumber(totalApy, { style: "percent" })}</span>
      </div>
    </div>
  );
}

type ApyTooltipProps = {
  triggerVariant?: ApyTooltipTriggerVariant;
  sparkleSide?: "left" | "right";
} & ApyTooltipContentProps;

function ApyTooltip({
  apyAfterFees,
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
        <ApyTooltipContent apyAfterFees={apyAfterFees} rewards={rewards} totalApy={totalApy} type={type} />
      </TooltipPopoverContent>
    </TooltipPopover>
  );
}

export { ApyTooltip, ApyTooltipContent, ApyTooltipTrigger };
