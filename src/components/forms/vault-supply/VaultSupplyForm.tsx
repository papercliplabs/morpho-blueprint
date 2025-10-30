"use client";

import { forwardRef, useImperativeHandle } from "react";
import type { VaultAction } from "@/actions";
import type { Vault } from "@/data/whisk/getVault";
import { VaultActionSimulationMetrics } from "../../ActionFlow/VaultActionFlow";
import { Button } from "../../ui/button";
import { ErrorMessage } from "../../ui/error-message";
import { Form } from "../../ui/form";
import { AssetInputFormField } from "../FormFields/AssetInputFormField";
import { useVaultSupplyForm } from "./useVaultSupplyForm";

interface VaultSupplyFormProps {
  vault: Vault;
  onSuccessfulActionSimulation: (action: VaultAction) => void;
}

export const VaultSupplyForm = forwardRef<{ reset: () => void }, VaultSupplyFormProps>(
  ({ vault, onSuccessfulActionSimulation }, ref) => {
    const { form, handleSubmit, position, isPositionLoading, derivedFormValues } = useVaultSupplyForm({
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
              <AssetInputFormField
                control={form.control}
                name="supplyAmount"
                header={`Supply ${vault.asset.symbol}`}
                chain={vault.chain}
                asset={vault.asset}
                maxValue={
                  position?.walletUnderlyingAssetHolding
                    ? BigInt(position.walletUnderlyingAssetHolding.balance.raw)
                    : undefined
                }
              />

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
                <ErrorMessage message={form.formState.errors.root?.message} />
              </div>
            </div>
          </fieldset>
        </form>
      </Form>
    );
  },
);
VaultSupplyForm.displayName = "VaultSupplyForm";
