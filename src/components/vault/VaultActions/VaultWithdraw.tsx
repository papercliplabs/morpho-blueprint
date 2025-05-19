"use client";

import { useState } from "react";

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

  return (
    <>
      <VaultWithdrawForm
        vault={vault}
        onSuccessfulActionSimulation={(action) => {
          setAction(action);
          setFlowOpen(true);
        }}
      />

      <VaultActionFlow
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
        }}
      />
    </>
  );
}
