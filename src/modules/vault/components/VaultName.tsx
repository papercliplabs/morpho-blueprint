import type { ChainInfo, TokenInfo } from "@/common/data/fragments";
import { TokenIcon } from "@/modules/token/components/TokenIcon";

interface VaultNameProps {
  chain: ChainInfo;
  name: string;
  asset: TokenInfo;
  chainClassName?: string;
}

export function VaultName({ chain, chainClassName, name, asset }: VaultNameProps) {
  return (
    <div className="flex min-w-0 gap-3">
      <TokenIcon token={asset} chain={chain} size="md" chainClassName={chainClassName} />
      <div className="flex min-w-0 flex-col justify-between">
        <span className="body-medium-plus truncate">{name}</span>
        <p className="flex gap-1">
          <span className="body-small-plus truncate text-muted-foreground">{asset.symbol}</span>
          <span className="body-small-plus text-muted-foreground">•</span>
          <span className="body-small-plus text-muted-foreground">{chain.name}</span>
        </p>
      </div>
    </div>
  );
}
