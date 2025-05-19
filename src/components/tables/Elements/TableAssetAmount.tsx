import NumberFlow from "@/components/ui/number-flow";
import { Skeleton } from "@/components/ui/skeleton";
import { TokenInfo } from "@/data/whisk/fragments";
import { descaleBigIntToNumber } from "@/utils/format";

interface TableAssetAmountProps {
  asset: TokenInfo;
  amount?: string; // BigIntString
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

  if (amount == undefined || amountUsd == undefined) {
    return <div className="text-muted-foreground body-medium-plus">-</div>;
  }

  const amountBigInt = BigInt(amount);
  if (amountBigInt == 0n) {
    return <div className="text-muted-foreground body-medium-plus">0</div>;
  }

  return (
    <div className="flex flex-col">
      <NumberFlow value={amountUsd ?? undefined} format={{ currency: "USD" }} className="body-medium-plus" />
      <NumberFlow
        value={amountBigInt ? descaleBigIntToNumber(amountBigInt, asset.decimals) : undefined}
        className="body-small-plus text-muted-foreground"
      />
    </div>
  );
}
