"use client";

import { useState } from "react";

import { SuccessfulVaultAction } from "@/actions/utils/types";
import { Vault } from "@/data/whisk/getVault";

import { VaultActionFlow } from "../ActionFlow/VaultActionFlow";
import VaultSupplyForm from "../Forms/VaultSupplyForm";

export default function VaultSupply({ vault, flowCompletionCb }: { vault: Vault; flowCompletionCb?: () => void }) {
  const [action, setAction] = useState<SuccessfulVaultAction | null>(null);
  const [flowOpen, setFlowOpen] = useState(false);

  return (
    <>
      <VaultSupplyForm
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
        actionName="Supply"
        onOpenChange={setFlowOpen}
        flowCompletionCb={flowCompletionCb}
      />
    </>
  );
}
