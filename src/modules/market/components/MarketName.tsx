import clsx from "clsx";
import { Badge } from "@/common/components/ui/badge";
import NumberFlow from "@/common/components/ui/number-flow";
import type { ChainInfo, TokenInfo } from "@/common/data/fragments";
import { TokenIcon } from "@/modules/token/components/TokenIcon";

interface MarketIdentifierProps {
  chain: ChainInfo;
  collateralAsset: TokenInfo | null;
  collateralAssetClassName?: string;
  lltv: number;
  loanAssetChainClassName?: string;
  loanAsset: TokenInfo;
  loanAssetClassName?: string;
  name: string;
  variant?: "default" | "sm";
}

export function MarketName({
  chain,
  collateralAsset,
  collateralAssetClassName,
  lltv,
  loanAssetChainClassName,
  loanAsset,
  loanAssetClassName,
  name,
  variant = "default",
}: MarketIdentifierProps) {
  return (
    <div className="flex w-full items-center gap-3">
      <div className="flex">
        {collateralAsset && (
          <TokenIcon
            token={collateralAsset}
            chain={chain}
            size="md"
            showChain={false}
            className={clsx("border-1 border-background", collateralAssetClassName)}
          />
        )}
        <TokenIcon
          token={loanAsset}
          chain={chain}
          size="md"
          className={clsx("border-1 border-background", collateralAsset && "-ml-3", loanAssetClassName)}
          chainClassName={loanAssetChainClassName}
        />
        {!collateralAsset && <div className="w-[20px]" />}
      </div>
      <div
        className={clsx(
          "overflow-hidden text-ellipsis whitespace-nowrap",
          variant === "sm" ? "body-medium-plus" : "heading-3",
        )}
      >
        {name}
      </div>
      <Badge variant={variant === "sm" ? "small" : "default"}>
        <NumberFlow
          value={lltv}
          format={{ style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 2 }}
          className={variant === "sm" ? "body-small-plus" : "body-medium-plus"}
        />
      </Badge>
    </div>
  );
}
