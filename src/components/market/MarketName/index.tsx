import clsx from "clsx";

import { TokenIcon } from "@/components/TokenIcon";
import { Badge } from "@/components/ui/badge";
import NumberFlow from "@/components/ui/number-flow";
import { ChainInfo, TokenInfo } from "@/data/whisk/fragments";

interface MarketIdentifierProps {
  chain: ChainInfo;
  name: string;
  collateralAsset: TokenInfo | null;
  loanAsset: TokenInfo;
  lltv: number;
  variant?: "default" | "sm";
}

export function MarketName({
  chain,
  name,
  collateralAsset,
  loanAsset,
  lltv,
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
            className="border-background border-2"
          />
        )}
        <TokenIcon
          token={loanAsset}
          chain={chain}
          size="md"
          className={clsx("border-background border-2", collateralAsset && "-ml-3")}
        />
        {!collateralAsset && <div className="w-[20px]" />}
      </div>
      <div
        className={clsx(
          "overflow-hidden text-ellipsis whitespace-nowrap",
          variant === "sm" ? "body-medium-plus" : "heading-3"
        )}
      >
        {name}
      </div>
      <Badge variant={variant === "sm" ? "small" : "default"}>
        <NumberFlow
          value={lltv}
          format={{ style: "percent", minimumFractionDigits: 0, maximumFractionDigits: 0 }}
          className={variant === "sm" ? "body-small-plus" : "body-medium-plus"}
        />
      </Badge>
    </div>
  );
}
