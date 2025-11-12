"use client";

import { MathLib } from "@morpho-org/blue-sdk";
import { forwardRef, useImperativeHandle } from "react";
import { maxUint256 } from "viem";
import type { MarketAction } from "@/actions";
import type { MarketNonIdle } from "@/data/whisk/getMarket";
import { MarketActionSimulationMetrics } from "../../ActionFlow/MarketActionFlow";
import { Button } from "../../ui/button";
import { ErrorMessage } from "../../ui/error-message";
import { Form } from "../../ui/form";
import { Separator } from "../../ui/seperator";
import { AssetInputFormField } from "../FormFields/AssetInputFormField";
import { useMarketRepayAndWithdrawCollateralForm } from "./useMarketRepayAndWithdrawCollateralForm";

interface MarketRepayAndWithdrawCollateralFormProps {
  market: MarketNonIdle;
  onSuccessfulActionSimulation: (action: MarketAction) => void;
}

export const MarketRepayAndWithdrawCollateralForm = forwardRef<
  { reset: () => void },
  MarketRepayAndWithdrawCollateralFormProps
>(({ market, onSuccessfulActionSimulation }, ref) => {
  const { form, handleSubmit, position, isPositionLoading, derivedFormValues, submitErrorMsg } =
    useMarketRepayAndWithdrawCollateralForm({
      market,
      onSuccessfulActionSimulation,
    });

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
                name="repayAmount"
                header={`Repay ${market.loanAsset.symbol}`}
                chain={market.chain}
                asset={market.loanAsset}
                maxValue={
                  position
                    ? MathLib.min(
                        BigInt(position?.borrowAmount?.raw ?? maxUint256),
                        BigInt(position?.walletLoanAssetHolding?.balance.raw ?? maxUint256),
                      )
                    : undefined
                }
                setIsMax={(isMax) => {
                  // Only full repay when wallet balance >= position balance
                  if (
                    isMax &&
                    position &&
                    BigInt(position.walletLoanAssetHolding?.balance.raw ?? 0) >= BigInt(position.borrowAmount.raw)
                  ) {
                    form.setValue("isMaxRepay", true);
                  } else {
                    form.setValue("isMaxRepay", false);
                  }
                }}
              />
              <AssetInputFormField
                control={form.control}
                name="withdrawCollateralAmount"
                header={`Withdraw ${market.collateralAsset.symbol}`}
                chain={market.chain}
                asset={market.collateralAsset}
                maxValue={derivedFormValues.maxWithdrawCollateralAmount}
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
MarketRepayAndWithdrawCollateralForm.displayName = "MarketRepayAndWithdrawCollateralForm";
