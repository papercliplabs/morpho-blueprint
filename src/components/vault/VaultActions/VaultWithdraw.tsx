"use client";

import { useRef, useState } from "react";

import { SuccessfulVaultAction } from "@/actions/utils/types";
import { VaultActionFlow } from "@/components/ActionFlow/VaultActionFlow";
import { VaultWithdrawForm } from "@/components/forms/VaultWithdrawForm";
import { Vault } from "@/data/whisk/getVault";

export default function VaultWithdraw({
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
      <VaultWithdrawForm
        vault={vault}
        onSuccessfulActionSimulation={(action) => {
          setAction(action);
          setFlowOpen(true);
        }}
        ref={formRef}
      />

      <VaultActionFlow
        trackingTag="vault-withdraw"
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
