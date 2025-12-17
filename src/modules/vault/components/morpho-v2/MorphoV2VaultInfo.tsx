import AvatarGroup from "@/common/components/AvatarGroup";
import { LinkExternalBlockExplorer } from "@/common/components/LinkExternal";
import NumberFlow from "@/common/components/ui/number-flow";
import { getAvatarForAddress } from "@/common/utils/getAvatarForAddress";
import { TokenIcon } from "@/modules/token/components/TokenIcon";
import type { MorphoVaultV2 } from "@/modules/vault/vault.types";
import { VaultInfoMetric, type VaultMetric } from "../VaultInfo";

export const MorphoV2VaultMetrics: Array<VaultMetric["id"]> = [
  "performance-fee",
  "management-fee",
  "vault-address",
  "underlying-asset",
  "curator",
  "sentinel",
] as const;

export async function MorphoV2VaultInfo(props: { vaultPromise: Promise<MorphoVaultV2> }) {
  const vault = await props.vaultPromise;
  const { performanceFee, managementFee, vaultAddress, asset, chain, curatorAddress, sentinelAddresses } = vault;

  return (
    <>
      <VaultInfoMetric id="performance-fee">
        <NumberFlow value={Number(performanceFee.formatted)} format={{ style: "percent" }} />
      </VaultInfoMetric>

      <VaultInfoMetric id="management-fee">
        <NumberFlow value={Number(managementFee.formatted)} format={{ style: "percent" }} />
      </VaultInfoMetric>

      <VaultInfoMetric id="vault-address">
        <LinkExternalBlockExplorer chainId={chain.id} type="address" address={vaultAddress} />
      </VaultInfoMetric>

      <VaultInfoMetric id="underlying-asset">
        <span className="flex items-center gap-1">
          <TokenIcon token={asset} chain={chain} size="sm" showChain={false} />
          <LinkExternalBlockExplorer chainId={chain.id} type="address" address={asset.address} />
        </span>
      </VaultInfoMetric>

      <VaultInfoMetric id="curator">
        <LinkExternalBlockExplorer chainId={chain.id} type="address" address={curatorAddress} />
      </VaultInfoMetric>

      <VaultInfoMetric id="sentinel">
        {sentinelAddresses && sentinelAddresses.length > 0 ? (
          <AvatarGroup avatars={sentinelAddresses.map(getAvatarForAddress)} size="sm" />
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </VaultInfoMetric>
    </>
  );
}
