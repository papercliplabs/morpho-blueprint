"use client";

import { forwardRef, useImperativeHandle } from "react";

import type { VaultAction } from "@/actions";
import { TooltipPopover, TooltipPopoverContent, TooltipPopoverTrigger } from "@/components/ui/tooltip-popover";
import type { Vault } from "@/data/whisk/getVault";
import { VaultActionSimulationMetrics } from "../../ActionFlow/VaultActionFlow";
import { Button } from "../../ui/button";
import { ErrorMessage } from "../../ui/error-message";
import { Form } from "../../ui/form";
import { AssetInputFormField } from "../FormFields/AssetInputFormField";
import SwitchFormField from "../FormFields/SwitchFormField";
import { isVaultUnderlyingAssetWrappedNativeAsset } from "../vault-supply/utils";
import { useVaultWithdrawForm } from "./useVaultWithdrawForm";

interface VaultWithdrawFormProps {
  vault: Vault;
  onSuccessfulActionSimulation: (action: VaultAction) => void;
}

export const VaultWithdrawForm = forwardRef<{ reset: () => void }, VaultWithdrawFormProps>(
  ({ vault, onSuccessfulActionSimulation }, ref) => {
    const { form, handleSubmit, position, isPositionLoading, derivedFormValues, submitErrorMsg, nativeAssetSymbol } =
      useVaultWithdrawForm({
        vault,
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
              <div className="space-y-2">
                <AssetInputFormField
                  control={form.control}
                  name="withdrawAmount"
                  header={`Withdraw ${vault.asset.symbol}`}
                  chain={vault.chain}
                  asset={vault.asset}
                  maxValue={position ? BigInt(position.assets.raw) : undefined}
                  setIsMax={(isMax) => {
                    form.setValue("isMaxWithdraw", isMax);
                  }}
                />
                {isVaultUnderlyingAssetWrappedNativeAsset(vault) && (
                  <SwitchFormField
                    control={form.control}
                    name="unwrapNativeAssets"
                    labelContent={
                      <TooltipPopover>
                        <TooltipPopoverTrigger className="body-small-plus w-fit whitespace-nowrap text-muted-foreground underline decoration-dashed underline-offset-3">
                          Unwrap
                        </TooltipPopoverTrigger>
                        <TooltipPopoverContent>
                          Automatically unwrap your withdrawn {vault.asset.symbol} into {nativeAssetSymbol}.
                        </TooltipPopoverContent>
                      </TooltipPopover>
                    }
                  />
                )}
              </div>

              <div className="h-[1px] bg-border" />

              <VaultActionSimulationMetrics
                vault={vault}
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
  },
);
VaultWithdrawForm.displayName = "VaultWithdrawForm";
