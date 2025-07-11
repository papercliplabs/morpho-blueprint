import { TokenIcon } from "@/components/TokenIcon";
import type { ChainInfo, TokenInfo } from "@/data/whisk/fragments";

interface VaultNameProps {
  chain: ChainInfo;
  name: string;
  asset: TokenInfo;
  chainClassName?: string;
}

export function VaultName({ chain, chainClassName, name, asset }: VaultNameProps) {
  return (
    <div className="flex gap-3">
      <TokenIcon token={asset} chain={chain} size="md" chainClassName={chainClassName} />
      <div className="flex flex-col justify-between">
        <span className="body-medium-plus">{name}</span>
        <span className="body-small-plus text-muted-foreground">
          {asset.symbol} • {chain.name}
        </span>
      </div>
    </div>
  );
}
