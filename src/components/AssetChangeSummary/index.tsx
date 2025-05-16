import { Avatar } from "@/components/ui/avatar";
import { TokenInfo } from "@/data/whisk/fragments";
import { formatNumber } from "@/utils/format";
import { cn } from "@/utils/shadcn";

import Minus from "../ui/icons/Minus";
import Plus from "../ui/icons/Plus";

type AssetChangeSummaryProps = {
  amount: number;
  amountUsd?: number;
  asset: TokenInfo;
  description: string;
  isIncreasing: boolean;
  label: string;
} & React.ComponentProps<"div">;

function AssetChangeSummary({
  amount,
  amountUsd,
  asset,
  className,
  description,
  isIncreasing,
  label,
  ...props
}: AssetChangeSummaryProps) {
  return (
    <div
      className={cn("bg-muted flex w-full items-center justify-between gap-3 rounded-sm px-4 py-3", className)}
      {...props}
    >
      <Avatar
        src={asset.icon}
        fallback={asset.symbol}
        alt={asset.symbol}
        sub={
          isIncreasing ? (
            <Plus className="fill-primary stroke-white" />
          ) : (
            <Minus className="fill-primary stroke-white" />
          )
        }
        size="md"
      />
      <div className="flex flex-grow flex-col">
        <span className="body-medium-plus">{label}</span>
        <span className="body-small text-muted-foreground">{description}</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="body-medium-plus">{formatNumber(amount)}</span>
        {amountUsd && (
          <span className="text-muted-foreground body-small">{formatNumber(amountUsd, { currency: "USD" })}</span>
        )}
      </div>
    </div>
  );
}

export { AssetChangeSummary, type AssetChangeSummaryProps };
