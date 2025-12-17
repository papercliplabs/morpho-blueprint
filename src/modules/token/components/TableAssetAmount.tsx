import NumberFlow from "@/common/components/ui/number-flow";
import { Skeleton } from "@/common/components/ui/skeleton";
import type { TokenInfo } from "@/common/data/fragments";
import { descaleBigIntToNumber } from "@/common/utils/format";
import type { BigIntish } from "@/whisk-types";

interface TableAssetAmountProps {
  asset: TokenInfo;
  amount?: BigIntish;
  amountUsd?: number | null;
  isLoading: boolean;
}

export function TableAssetAmount({ asset, amount, amountUsd, isLoading }: TableAssetAmountProps) {
  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-[24px] w-[60px]" />
      </div>
    );
  }

  if (amount === undefined) {
    // Render "-" only if we have no amount, no USD price is ok
    return <div className="body-medium-plus text-muted-foreground">-</div>;
  }

  const amountBigInt = BigInt(amount);
  if (amountBigInt === 0n) {
    return <div className="body-medium-plus text-muted-foreground">0</div>;
  }

  return (
    <div className="flex flex-col">
      <NumberFlow value={amountUsd ?? undefined} format={{ currency: "USD" }} className="body-medium-plus" />
      <NumberFlow
        value={amountBigInt ? descaleBigIntToNumber(amountBigInt, asset.decimals) : undefined}
        className="body-small text-muted-foreground"
      />
    </div>
  );
}
