import { LinkExternalBlockExplorer } from "@/components/LinkExternal";
import NumberFlow from "@/components/ui/number-flow";
import type { MorphoVaultV1 } from "@/utils/types";
import { VaultInfoMetric, type VaultMetric } from "../VaultInfo";

export const MorphoV1VaultMetrics: Array<VaultMetric["id"]> = [
  "performance-fee",
  "fee-recipient",
  "owner",
  "vault-address",
  "curator",
  "guardian-address",
] as const;

export async function MorphoV1VaultInfo(props: { vaultPromise: Promise<MorphoVaultV1> }) {
  const vault = await props.vaultPromise;

  return (
    <>
      <VaultInfoMetric id="performance-fee">
        <NumberFlow value={vault.performanceFeeRaw} format={{ style: "percent" }} />
      </VaultInfoMetric>

      {vault.feeRecipientAddress && (
        <VaultInfoMetric id="fee-recipient">
          <LinkExternalBlockExplorer chainId={vault.chain.id} type="address" address={vault.feeRecipientAddress} />
        </VaultInfoMetric>
      )}

      <VaultInfoMetric id="owner">
        <LinkExternalBlockExplorer chainId={vault.chain.id} type="address" address={vault.ownerAddress} />
      </VaultInfoMetric>

      <VaultInfoMetric id="vault-address">
        <LinkExternalBlockExplorer chainId={vault.chain.id} type="address" address={vault.vaultAddress} />
      </VaultInfoMetric>

      <VaultInfoMetric id="curator">
        <LinkExternalBlockExplorer chainId={vault.chain.id} type="address" address={vault.curatorAddress} />
      </VaultInfoMetric>

      <VaultInfoMetric id="guardian-address">
        <LinkExternalBlockExplorer chainId={vault.chain.id} type="address" address={vault.guardianAddress} />
      </VaultInfoMetric>
    </>
  );
}
