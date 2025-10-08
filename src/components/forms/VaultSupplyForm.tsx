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
import { descaleBigIntToNumber } from "@/utils/format";
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

    const walletUnderlyingAssetBalanceRaw = useMemo(() => {
      if (!position?.walletUnderlyingAssetHolding) {
        return undefined as undefined | bigint;
      }

      return BigInt(position.walletUnderlyingAssetHolding.balance.raw ?? 0n);
    }, [position]);

    const formSchema = useMemo(() => {
      return z
        .object({
          supplyAmount: z
            .string()
            .pipe(z.coerce.number().nonnegative({ message: "Amount must be >=0" }))
            .pipe(z.coerce.string()),
          isMaxSupply: z.boolean(),
        })
        .superRefine((data, ctx) => {
          try {
            const rawSupplyAmount = parseUnits(data.supplyAmount, vault.asset.decimals);
            const maxSupplyRaw = walletUnderlyingAssetBalanceRaw ?? 0n;
            if (rawSupplyAmount > maxSupplyRaw) {
              ctx.addIssue({
                path: ["supplyAmount"],
                code: z.ZodIssueCode.custom,
                message: "Amount exceeds wallet balance.",
              });
            }
          } catch {
            ctx.addIssue({
              path: ["supplyAmount"],
              code: z.ZodIssueCode.custom,
              message: "Invalid amount.",
            });
          }
        });
    }, [walletUnderlyingAssetBalanceRaw, vault.asset.decimals]);

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
                maxValue={descaleBigIntToNumber(walletUnderlyingAssetBalanceRaw ?? 0n, vault.asset.decimals)}
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
