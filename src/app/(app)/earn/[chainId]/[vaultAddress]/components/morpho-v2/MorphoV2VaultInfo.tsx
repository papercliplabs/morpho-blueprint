import AvatarGroup from "@/components/AvatarGroup";
import { LinkExternalBlockExplorer } from "@/components/LinkExternal";
import { TokenIcon } from "@/components/TokenIcon";
import { getAvatarForAddress } from "@/components/ui/avatar";
import NumberFlow from "@/components/ui/number-flow";
import type { MorphoVaultV2 } from "@/utils/types";
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
