"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useModal } from "connectkit";
import { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDebounce } from "use-debounce";
import { getAddress, maxUint256, parseUnits } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import type { z } from "zod";
import { type SuccessfulVaultAction, vaultWithdrawAction } from "@/actions";
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
import { createVaultWithdrawFormSchema } from "./schema/vault";

interface VaultWithdrawFormProps {
  vault: Vault;
  onSuccessfulActionSimulation: (action: SuccessfulVaultAction) => void;
}

export const VaultWithdrawForm = forwardRef<{ reset: () => void }, VaultWithdrawFormProps>(
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

    const positionBalanceRaw = useMemo(() => {
      if (!position?.supplyAmount) {
        return undefined as undefined | bigint;
      }

      return BigInt(position.supplyAmount.raw ?? 0n);
    }, [position]);

    const formSchema = useMemo(() => {
      return createVaultWithdrawFormSchema({
        asset: vault.asset,
        positionBalanceRaw,
      });
    }, [positionBalanceRaw, vault.asset]);

    const form = useForm({
      mode: "onChange",
      resolver: zodResolver(formSchema),
      defaultValues: {
        withdrawAmount: "",
        isMaxWithdraw: false,
      },
    });

    // Expose reset method to parent
    useImperativeHandle(ref, () => ({
      reset: () => {
        form.reset();
      },
    }));

    const withdrawAmount = useWatchNumberInputField(form.control, "withdrawAmount");

    const missingAmountInput = useMemo(() => {
      return withdrawAmount === 0;
    }, [withdrawAmount]);

    const [debouncedWithdrawAmount] = useDebounce(withdrawAmount, 300);
    const simulationMetrics = useMemo(() => {
      const positionChange = computeVaultPositionChange({
        currentPosition: position,
        supplyAmountChange: -debouncedWithdrawAmount,
      });

      return (
        <VaultActionSimulationMetrics vault={vault} positionChange={positionChange} isLoading={isPositionLoading} />
      );
    }, [debouncedWithdrawAmount, position, vault, isPositionLoading]);

    const handleSubmit = useCallback(
      async ({ withdrawAmount, isMaxWithdraw }: z.infer<typeof formSchema>) => {
        if (!address) {
          setConnectKitOpen(true);
          return;
        }

        if (!publicClient) {
          throw new Error(`Missing public client for chain ${vault.chain.id}`);
        }

        setSimulationErrorMsg(null);
        setSimulating(true);

        const rawWithdrawAmount = isMaxWithdraw ? maxUint256 : parseUnits(withdrawAmount, vault.asset.decimals);

        const action = await vaultWithdrawAction({
          publicClient,
          vaultAddress: getAddress(vault.vaultAddress),
          accountAddress: address,
          withdrawAmount: rawWithdrawAmount,
        });

        if (action.status === "success") {
          onSuccessfulActionSimulation(action);
        } else {
          setSimulationErrorMsg(action.message);
        }

        setSimulating(false);
      },
      [address, setConnectKitOpen, publicClient, onSuccessfulActionSimulation, vault],
    );
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <fieldset disabled={simulating} style={{ all: "unset", width: "100%" }}>
            <div className="flex flex-col gap-6">
              <AssetInputFormField
                control={form.control}
                name="withdrawAmount"
                header={`Withdraw ${vault.asset.symbol}`}
                chain={vault.chain}
                asset={vault.asset}
                maxValue={positionBalanceRaw ?? 0n}
                setIsMax={(isMax) => {
                  form.setValue("isMaxWithdraw", isMax);
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
VaultWithdrawForm.displayName = "VaultWithdrawForm";
