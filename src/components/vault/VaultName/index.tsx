import { TokenIcon } from "@/components/TokenIcon";
import { ChainInfo, TokenInfo } from "@/data/whisk/fragments";

interface VaultNameProps {
  chain: ChainInfo;
  name: string;
  asset: TokenInfo;
}

export function VaultName({ chain, name, asset }: VaultNameProps) {
  return (
    <div className="flex gap-3">
      <TokenIcon token={asset} chain={chain} size="md" />
      <div className="flex flex-col justify-between">
        <span className="body-medium-plus">{name}</span>
        <span className="body-small-plus text-muted-foreground">
          {asset.symbol} • {chain.name}
        </span>
      </div>
    </div>
  );
}
