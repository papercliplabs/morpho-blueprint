"use client";

import { forwardRef, useImperativeHandle } from "react";

import type { MarketAction } from "@/actions";
import { Button } from "@/common/components/ui/button";
import { ErrorMessage } from "@/common/components/ui/error-message";
import { Form } from "@/common/components/ui/form";
import { Separator } from "@/common/components/ui/seperator";
import { MarketActionSimulationMetrics } from "@/modules/action-flow/components/MarketActionFlow";
import type { MarketNonIdle } from "@/modules/market/data/getMarket";
import { AssetInputFormField } from "@/modules/token/components/AssetInputFormField";
import { useMarketSupplyCollateralAndBorrowForm } from "./useMarketSupplyCollateralAndBorrowForm";

interface MarketSupplyCollateralAndBorrowFormProps {
  market: MarketNonIdle;
  onSuccessfulActionSimulation: (action: MarketAction) => void;
}

export const MarketSupplyCollateralAndBorrowForm = forwardRef<
  { reset: () => void },
  MarketSupplyCollateralAndBorrowFormProps
>(({ market, onSuccessfulActionSimulation }, ref) => {
  const { form, handleSubmit, position, isPositionLoading, derivedFormValues, submitErrorMsg } =
    useMarketSupplyCollateralAndBorrowForm({ market, onSuccessfulActionSimulation });

  // Expose reset method to parent
  useImperativeHandle(ref, () => ({
    reset: () => {
      form.reset();
    },
  }));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <fieldset disabled={form.formState.isSubmitting} style={{ all: "unset", width: "100%" }}>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <AssetInputFormField
                control={form.control}
                name="supplyCollateralAmount"
                header={`Add ${market.collateralAsset.symbol}`}
                chain={market.chain}
                asset={market.collateralAsset}
                maxValue={position ? BigInt(position.walletCollateralAssetHolding?.balance.raw ?? 0) : undefined}
                setIsMax={(isMax) => {
                  form.setValue("isMaxSupplyCollateral", isMax);
                }}
              />
              <AssetInputFormField
                control={form.control}
                name="borrowAmount"
                header={`Borrow ${market.loanAsset.symbol}`}
                chain={market.chain}
                asset={market.loanAsset}
                maxValue={derivedFormValues.maxBorrowable}
              />
            </div>

            <Separator />

            <MarketActionSimulationMetrics
              market={market}
              positionChange={derivedFormValues.positionChange}
              isLoading={isPositionLoading}
            />

            <div className="flex flex-col gap-1">
              <Button
                disabled={!form.formState.isValid}
                isLoading={form.formState.isSubmitting}
                loadingMessage="Simulating"
                size="lg"
                type="submit"
              >
                {derivedFormValues.missingAmount ? "Enter an amount" : "Review"}
              </Button>
              <ErrorMessage message={submitErrorMsg} />
            </div>
          </div>
        </fieldset>
      </form>
    </Form>
  );
});
MarketSupplyCollateralAndBorrowForm.displayName = "MarketSupplyCollateralAndBorrowForm";
