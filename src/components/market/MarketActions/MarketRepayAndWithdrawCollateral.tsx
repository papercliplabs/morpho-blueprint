"use client";

import { useState } from "react";

import { SuccessfulMarketAction } from "@/actions/utils/types";
import { MarketActionFlow } from "@/components/ActionFlow/MarketActionFlow";
import { MarketRepayAndWithdrawCollateralForm } from "@/components/forms/MarketRepayAndWithdrawCollateralForm";
import { MarketNonIdle } from "@/data/whisk/getMarket";

export default function MarketRepayAndWithdrawCollateral({
  market,
  onFlowClosed,
}: {
  market: MarketNonIdle;
  onFlowClosed?: (success: boolean) => void;
}) {
  const [action, setAction] = useState<SuccessfulMarketAction | null>(null);
  const [flowOpen, setFlowOpen] = useState(false);
  const [success, setSuccess] = useState(false);

  return (
    <>
      <MarketRepayAndWithdrawCollateralForm
        market={market}
        onSuccessfulActionSimulation={(action) => {
          setAction(action);
          setFlowOpen(true);
        }}
      />

      <MarketActionFlow
        market={market}
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
