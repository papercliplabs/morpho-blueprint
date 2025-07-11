"use client";

import { useRef, useState } from "react";

import type { SuccessfulVaultAction } from "@/actions";
import { VaultActionFlow } from "@/components/ActionFlow/VaultActionFlow";
import { VaultSupplyForm } from "@/components/forms/VaultSupplyForm";
import type { Vault } from "@/data/whisk/getVault";

export default function VaultSupply({
  vault,
  onFlowClosed,
}: {
  vault: Vault;
  onFlowClosed?: (success: boolean) => void;
}) {
  const [action, setAction] = useState<SuccessfulVaultAction | null>(null);
  const [flowOpen, setFlowOpen] = useState(false);
  const [success, setSuccess] = useState(false);

  const formRef = useRef<{ reset: () => void }>(null);

  return (
    <>
      <VaultSupplyForm
        vault={vault}
        onSuccessfulActionSimulation={(action) => {
          setAction(action);
          setFlowOpen(true);
        }}
        ref={formRef}
      />

      <VaultActionFlow
        trackingTag="vault-supply"
        vault={vault}
        action={action}
        open={flowOpen}
        onOpenChange={(open) => {
          setFlowOpen(open);
          if (!open) {
            onFlowClosed?.(success);
          }
        }}
        flowCompletionCb={() => {
          setSuccess(true);
          formRef.current?.reset();
        }}
      />
    </>
  );
}
