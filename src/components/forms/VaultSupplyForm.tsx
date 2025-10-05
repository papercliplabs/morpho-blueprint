"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useModal } from "connectkit";
import { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDebounce } from "use-debounce";
import { getAddress, maxUint256, parseUnits } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { z } from "zod";

import { type SuccessfulVaultAction, vaultSupplyAction } from "@/actions";
import type { SupportedChainId } from "@/config/types";
import type { Vault } from "@/data/whisk/getVault";
import { useVaultPosition } from "@/hooks/useVaultPositions";
import { useWatchNumberInputField } from "@/hooks/useWatchNumberInputField";
import { computeVaultPositionChange } from "@/utils/math";
import { VaultActionSimulationMetrics } from "../ActionFlow/VaultActionFlow";
import { Button } from "../ui/button";
import { ErrorMessage } from "../ui/error-message";
import { Form } from "../ui/form";
import { AssetInputFormField } from "./FormFields/AssetInputFormField";

interface VaultSupplyFormProps {
  vault: Vault;
  onSuccessfulActionSimulation: (action: SuccessfulVaultAction) => void;
}

export const VaultSupplyForm = forwardRef<{ reset: () => void }, VaultSupplyFormProps>(
  ({ vault, onSuccessfulActionSimulation }, ref) => {
    const { address } = useAccount();
    const publicClient = usePublicClient({ chainId: vault.chain.id });
    const { setOpen: setConnectKitOpen } = useModal();

    const [simulating, setSimulating] = useState(false);
    const [simulationErrorMsg, setSimulationErrorMsg] = useState<string | null>(null);

    const { data: position, isLoading: isPositionLoading } = useVaultPosition(
      vault.chain.id as SupportedChainId,
      getAddress(vault.vaultAddress),
    );

    const walletUnderlyingAssetBalance = useMemo(() => {
      if (!position?.walletUnderlyingAssetHolding) {
        return undefined;
      }

      return Number(position.walletUnderlyingAssetHolding.balance.formatted);
    }, [position]);

    const formSchema = useMemo(() => {
      return z
        .object({
          supplyAmount: z.string(),
          isMaxSupply: z.boolean(),
        })
        .superRefine((data, ctx) => {
          const supplyAmount = Number(data.supplyAmount);

          if (Number.isNaN(supplyAmount) || supplyAmount < 0) {
            ctx.addIssue({
              path: ["supplyAmount"],
              code: z.ZodIssueCode.custom,
              message: "Amount must be >=0.",
            });
          }

          const maxSupplyAmount = walletUnderlyingAssetBalance ?? Number.POSITIVE_INFINITY;
          if (supplyAmount > maxSupplyAmount) {
            ctx.addIssue({
              path: ["supplyAmount"],
              code: z.ZodIssueCode.custom,
              message: "Amount exceeds wallet balance.",
            });
          }
        });
    }, [walletUnderlyingAssetBalance]);

    const form = useForm({
      mode: "onChange",
      resolver: zodResolver(formSchema),
      defaultValues: {
        supplyAmount: "",
        isMaxSupply: false,
      },
    });

    // Expose reset method to parent
    useImperativeHandle(ref, () => ({
      reset: () => {
        form.reset();
      },
    }));

    const supplyAmount = useWatchNumberInputField(form.control, "supplyAmount");

    const missingAmountInput = useMemo(() => {
      return supplyAmount === 0;
    }, [supplyAmount]);

    const [debouncedSupplyAmount] = useDebounce(supplyAmount, 300);
    const simulationMetrics = useMemo(() => {
      const positionChange = computeVaultPositionChange({
        currentPosition: position,
        supplyAmountChange: debouncedSupplyAmount,
      });

      return (
        <VaultActionSimulationMetrics vault={vault} positionChange={positionChange} isLoading={isPositionLoading} />
      );
    }, [debouncedSupplyAmount, position, vault, isPositionLoading]);

    const handleSubmit = useCallback(
      async ({ supplyAmount, isMaxSupply }: z.infer<typeof formSchema>) => {
        if (!address) {
          setConnectKitOpen(true);
          return;
        }

        if (!publicClient) {
          throw new Error(`Missing public client for chain ${vault.chain.id}`);
        }

        setSimulationErrorMsg(null);
        setSimulating(true);

        const rawSupplyAmount = isMaxSupply ? maxUint256 : parseUnits(supplyAmount, vault.asset.decimals);

        const action = await vaultSupplyAction({
          publicClient,
          vaultAddress: getAddress(vault.vaultAddress),
          accountAddress: address,
          supplyAmount: rawSupplyAmount,
          allowWrappingNativeAssets: false, // TODO: revisit
        });

        if (action.status === "success") {
          onSuccessfulActionSimulation(action);
        } else {
          setSimulationErrorMsg(action.message);
        }

        setSimulating(false);
      },
      [address, setConnectKitOpen, publicClient, vault, onSuccessfulActionSimulation],
    );

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <fieldset disabled={simulating} style={{ all: "unset", width: "100%" }}>
            <div className="flex flex-col gap-6">
              <AssetInputFormField
                control={form.control}
                name="supplyAmount"
                header={`Supply ${vault.asset.symbol}`}
                chain={vault.chain}
                asset={vault.asset}
                maxValue={walletUnderlyingAssetBalance}
                setIsMax={(isMax) => {
                  form.setValue("isMaxSupply", isMax);
                }}
              />

              <div className="h-[1px] bg-border" />

              {simulationMetrics}

              <div className="flex flex-col gap-1">
                <Button
                  disabled={simulating || !form.formState.isValid || missingAmountInput}
                  isLoading={simulating}
                  loadingMessage="Simulating"
                  size="lg"
                  type="submit"
                >
                  {missingAmountInput ? "Enter an amount" : "Review"}
                </Button>
                <ErrorMessage message={simulationErrorMsg} />
              </div>
            </div>
          </fieldset>
        </form>
      </Form>
    );
  },
);
VaultSupplyForm.displayName = "VaultSupplyForm";
