"use client";

import { useRef, useState } from "react";

import type { MarketAction } from "@/actions";
import { MarketActionFlow } from "@/modules/action-flow/components/MarketActionFlow";
import { MarketRepayAndWithdrawCollateralForm } from "@/modules/market/components/MarketRepayAndWithdrawCollateralForm/MarketRepayAndWithdrawCollateralForm";
import type { MarketNonIdle } from "@/modules/market/data/getMarket";

export default function MarketRepayAndWithdrawCollateral({
  market,
  onFlowClosed,
}: {
  market: MarketNonIdle;
  onFlowClosed?: (success: boolean) => void;
}) {
  const [action, setAction] = useState<MarketAction | null>(null);
  const [flowOpen, setFlowOpen] = useState(false);
  const [success, setSuccess] = useState(false);

  const formRef = useRef<{ reset: () => void }>(null);

  return (
    <>
      <MarketRepayAndWithdrawCollateralForm
        market={market}
        onSuccessfulActionSimulation={(action) => {
          setAction(action);
          setFlowOpen(true);
        }}
        ref={formRef}
      />

      <MarketActionFlow
        trackingTag="market-repay-and-withdraw-collateral"
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
          formRef.current?.reset();
        }}
      />
    </>
  );
}
