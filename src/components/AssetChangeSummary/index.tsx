import { Avatar } from "@/components/ui/avatar";
import type { TokenInfo } from "@/data/whisk/fragments";
import { formatNumber } from "@/utils/format";
import { cn } from "@/utils/shadcn";

import Minus from "../ui/icons/Minus";
import Plus from "../ui/icons/Plus";

type AssetChangeSummaryProps = {
  asset: TokenInfo;
  label: string;
  description?: string;
  amount: number;
  amountUsd?: number;
} & React.ComponentProps<"div">;

function AssetChangeSummary({
  asset,
  label,
  description,
  amount,
  amountUsd,
  className,
  ...props
}: AssetChangeSummaryProps) {
  return (
    <div
      className={cn("flex w-full items-center justify-between gap-3 rounded-sm bg-muted px-4 py-3", className)}
      {...props}
    >
      <Avatar
        src={asset.icon}
        alt={asset.symbol}
        sub={amount > 0 ? <Plus className="[&>rect]:stroke-muted" /> : <Minus className="[&>rect]:stroke-muted" />}
        size="md"
      />
      <div className="flex flex-grow flex-col">
        <span className="body-medium-plus">{label}</span>
        {description && <span className="body-small text-muted-foreground">{description}</span>}
      </div>
      <div className="flex flex-col items-end">
        <span className="body-medium-plus">{formatNumber(Math.abs(amount))}</span>
        {amountUsd && (
          <span className="body-small text-muted-foreground">
            {formatNumber(Math.abs(amountUsd), { currency: "USD" })}
          </span>
        )}
      </div>
    </div>
  );
}

export { AssetChangeSummary, type AssetChangeSummaryProps };
