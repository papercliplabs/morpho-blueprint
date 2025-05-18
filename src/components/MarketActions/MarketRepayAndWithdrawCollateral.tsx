"use client";

import { useState } from "react";

import { SuccessfulMarketAction } from "@/actions/utils/types";
import { MarketNonIdle } from "@/data/whisk/getMarket";

import { MarketActionFlow } from "../ActionFlow/MarketActionFlow";
import { MarketRepayAndWithdrawCollateralForm } from "../Forms/MarketRepayAndWithdrawCollateralForm";

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
