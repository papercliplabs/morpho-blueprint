"use client";

import { useRef, useState } from "react";

import { SuccessfulMarketAction } from "@/actions";
import { MarketActionFlow } from "@/components/ActionFlow/MarketActionFlow";
import { MarketSupplyCollateralAndBorrowForm } from "@/components/forms/MarketSupplyCollateralAndBorrowForm";
import { MarketNonIdle } from "@/data/whisk/getMarket";

export default function MarketSupplyCollateralAndBorrow({
  market,
  onFlowClosed,
}: {
  market: MarketNonIdle;
  onFlowClosed?: (success: boolean) => void;
}) {
  const [action, setAction] = useState<SuccessfulMarketAction | null>(null);
  const [flowOpen, setFlowOpen] = useState(false);
  const [success, setSuccess] = useState(false);

  const formRef = useRef<{ reset: () => void }>(null);

  return (
    <>
      <MarketSupplyCollateralAndBorrowForm
        market={market}
        onSuccessfulActionSimulation={(action) => {
          setAction(action);
          setFlowOpen(true);
        }}
        ref={formRef}
      />

      <MarketActionFlow
        trackingTag="market-supply-collateral-and-borrow"
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
