"use client";

import { forwardRef, useImperativeHandle } from "react";

import type { SuccessfulMarketAction } from "@/actions";
import type { MarketNonIdle } from "@/data/whisk/getMarket";
import { MarketActionSimulationMetrics } from "../../ActionFlow/MarketActionFlow";
import { Button } from "../../ui/button";
import { ErrorMessage } from "../../ui/error-message";
import { Form } from "../../ui/form";
import { Separator } from "../../ui/seperator";
import { AssetInputFormField } from "../FormFields/AssetInputFormField";
import { useMarketSupplyCollateralAndBorrowForm } from "./useMarketSupplyCollateralAndBorrowForm";

interface MarketSupplyCollateralAndBorrowFormProps {
  market: MarketNonIdle;
  onSuccessfulActionSimulation: (action: SuccessfulMarketAction) => void;
}

export const MarketSupplyCollateralAndBorrowForm = forwardRef<
  { reset: () => void },
  MarketSupplyCollateralAndBorrowFormProps
>(({ market, onSuccessfulActionSimulation }, ref) => {
  const { form, handleSubmit, position, isPositionLoading, derivedFormValues } = useMarketSupplyCollateralAndBorrowForm(
    { market, onSuccessfulActionSimulation },
  );

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
              <ErrorMessage message={form.formState.errors.root?.message} />
            </div>
          </div>
        </fieldset>
      </form>
    </Form>
  );
});
MarketSupplyCollateralAndBorrowForm.displayName = "MarketSupplyCollateralAndBorrowForm";
