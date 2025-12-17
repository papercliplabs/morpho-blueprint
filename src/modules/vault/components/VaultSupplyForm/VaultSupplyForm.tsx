"use client";

import { forwardRef, useImperativeHandle } from "react";
import type { VaultAction } from "@/actions";
import SwitchFormField from "@/common/components/SwitchFormField";
import { Button } from "@/common/components/ui/button";
import { Card } from "@/common/components/ui/card";
import { ErrorMessage } from "@/common/components/ui/error-message";
import { Form } from "@/common/components/ui/form";
import { TooltipPopover, TooltipPopoverContent, TooltipPopoverTrigger } from "@/common/components/ui/tooltip-popover";
import { VaultActionSimulationMetrics } from "@/modules/action-flow/components/VaultActionFlow";
import { AssetInputFormField } from "@/modules/token/components/AssetInputFormField";
import type { Vault } from "@/modules/vault/data/getVault";
import { useVaultSupplyForm } from "./useVaultSupplyForm";
import { isVaultUnderlyingAssetWrappedNativeAsset } from "./utils";

interface VaultSupplyFormProps {
  vault: Vault;
  onSuccessfulActionSimulation: (action: VaultAction) => void;
}

export const VaultSupplyForm = forwardRef<{ reset: () => void }, VaultSupplyFormProps>(
  ({ vault, onSuccessfulActionSimulation }, ref) => {
    const { form, handleSubmit, isPositionLoading, derivedFormValues, submitErrorMsg, nativeAssetSymbol } =
      useVaultSupplyForm({
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
                  name="supplyAmount"
                  header={`Supply ${vault.asset.symbol}`}
                  chain={vault.chain}
                  asset={vault.asset}
                  maxValue={derivedFormValues.maxSupplyAmount}
                />

                {isVaultUnderlyingAssetWrappedNativeAsset(vault) && (
                  <SwitchFormField
                    control={form.control}
                    name="allowNativeAssetWrapping"
                    labelContent={
                      <TooltipPopover>
                        <TooltipPopoverTrigger className="body-small-plus w-fit whitespace-nowrap text-muted-foreground underline decoration-dashed underline-offset-3">
                          Allow wrapping
                        </TooltipPopoverTrigger>
                        <TooltipPopoverContent>
                          Allow wrapping your {nativeAssetSymbol} to supply alongside your {vault.asset.symbol}.
                        </TooltipPopoverContent>
                      </TooltipPopover>
                    }
                  />
                )}
              </div>

              {derivedFormValues.supplyWillLeaveLowNativeAssetBalance && (
                <Card className="flex gap-2 border-destructive bg-transparent p-4 text-destructive shadow-none">
                  This transaction will use most of your network tokens, which may leave you with insufficient balance
                  to cover future transaction fees.
                </Card>
              )}

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
VaultSupplyForm.displayName = "VaultSupplyForm";
