import Image from "next/image";
import { defaultUrlTransform } from "react-markdown";
import LinkExternal from "@/common/components/LinkExternal";
import { Badge } from "@/common/components/ui/badge";
import { APP_CONFIG } from "@/config";
import { TokenIcon } from "@/modules/token/components/TokenIcon";
import { VaultPositionHighlight } from "@/modules/vault/components/VaultPositionHighlight";
import type { Vault } from "@/modules/vault/data/getVault";
import { extractVaultCurator } from "@/modules/vault/utils/extractVaultCurator";
import { getVaultTagData } from "@/modules/vault/utils/getVaultTagData";

interface VaultHeaderProps {
  vaultPromise: Promise<Vault>;
}

export async function VaultHeader({ vaultPromise }: VaultHeaderProps) {
  const vault = await vaultPromise;
  if (!vault) return null;

  const curator = extractVaultCurator(vault);
  const tagData = getVaultTagData(vault.chain.id, vault.vaultAddress);

  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row">
      <div className="flex flex-col">
        <div className="flex h-[64px] items-center gap-3">
          <TokenIcon token={vault.asset} chain={vault.chain} size="md" />
          <h1 className="heading-3 flex items-center gap-3">{vault.name}</h1>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>
            Chain: <span className="text-foreground">{vault.chain.name}</span>
          </span>
          {curator && !APP_CONFIG.featureFlags.hideCurator && (
            <>
              <span>&bull;</span>
              <div className="flex items-center gap-1">
                <span>Curator: </span>
                <LinkExternal href={defaultUrlTransform(curator.url)} className="text-foreground">
                  {curator.name}
                  <Image
                    src={defaultUrlTransform(curator.image)}
                    alt={curator.name}
                    width={24}
                    height={24}
                    className="inline size-6 shrink-0 rounded-full border"
                  />
                </LinkExternal>
              </div>
            </>
          )}
          {tagData && (
            <>
              <span>&bull;</span>
              <Badge aria-label="Vault type" style={{ backgroundColor: tagData.color }}>
                {tagData.tag}
              </Badge>
            </>
          )}
        </div>
      </div>

      <VaultPositionHighlight vault={vault} />
    </div>
  );
}
