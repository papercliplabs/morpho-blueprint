"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAppKit } from "@reown/appkit/react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDebounce } from "use-debounce";
import { getAddress, maxUint256, parseUnits } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { z } from "zod";

import { VaultPositionChange } from "@/actions/utils/positionChange";
import { SuccessfulVaultAction } from "@/actions/utils/types";
import { vaultSupplyAction } from "@/actions/vault/vaultSupplyAction";
import { Vault } from "@/data/whisk/getVault";
import { useVaultPosition } from "@/hooks/useVaultPositions";
import { descaleBigIntToNumber } from "@/utils/format";

import { VaultActionSimulationMetrics } from "../ActionFlow/VaultActionFlow";
import { Button } from "../ui/button";
import { ErrorMessage } from "../ui/error-message";
import { Form } from "../ui/form";

import { AssetInputFormField } from "./FormFields/AssetInputFormField";

interface VaultSupplyFormProps {
  vault: Vault;
  onSuccessfulActionSimulation: (action: SuccessfulVaultAction) => void;
}

export default function VaultSupplyForm({ vault, onSuccessfulActionSimulation }: VaultSupplyFormProps) {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: vault.chain.id });
  const { open: openAppKit } = useAppKit();

  const [simulating, setSimulating] = useState(false);
  const [simulationErrorMsg, setSimulationErrorMsg] = useState<string | null>(null);

  const { data: position, isLoading: isPositionLoading } = useVaultPosition(
    vault.chain.id,
    getAddress(vault.vaultAddress)
  );

  const walletUnderlyingAssetBalance = useMemo(() => {
    if (!position?.walletUnderlyingAssetHolding) {
      return undefined;
    }

    return descaleBigIntToNumber(position.walletUnderlyingAssetHolding.balance, vault.asset.decimals);
  }, [position, vault.asset.decimals]);

  const formSchema = useMemo(() => {
    return z.object({
      supplyAmount: z
        .string()
        .nonempty("Amount is required.")
        .refine(
          (val) => {
            const num = Number(val);
            return !isNaN(num) && num > 0;
          },
          {
            message: "Amount must be >0.",
          }
        )
        .refine(
          (val) => {
            const num = Number(val);
            return num <= (walletUnderlyingAssetBalance ?? Infinity);
          },
          {
            message: "Amount exceeds wallet balance.",
          }
        ),
      isMaxSupply: z.boolean(),
    });
  }, [walletUnderlyingAssetBalance]);

  const form = useForm({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplyAmount: undefined,
      isMaxSupply: false,
    },
  });

  async function handleSubmit({ supplyAmount, isMaxSupply }: z.infer<typeof formSchema>) {
    if (!address) {
      openAppKit();
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

    if (action.status == "success") {
      onSuccessfulActionSimulation(action);
    } else {
      setSimulationErrorMsg(action.message);
    }

    setSimulating(false);
  }

  const supplyAmount = form.watch("supplyAmount") ?? "0";
  const [debouncedSupplyAmount] = useDebounce(supplyAmount, 300);

  const simulationMetrics = useMemo(() => {
    const currentSupply =
      position?.supplyAssets != undefined ? descaleBigIntToNumber(position.supplyAssets, vault.asset.decimals) : 0;

    const supplyAmount = Number(debouncedSupplyAmount);
    const newSupply = currentSupply == undefined ? 0 : currentSupply + supplyAmount;

    const positionChange: VaultPositionChange = {
      balance: {
        before: {
          rawAmount: 0n, // Unused
          amount: currentSupply,
        },
        after: {
          rawAmount: 0n, // Unused
          amount: newSupply,
        },
        delta: {
          rawAmount: 0n, // Unused
          amount: supplyAmount,
        },
      },
    };

    return <VaultActionSimulationMetrics vault={vault} positionChange={positionChange} isLoading={isPositionLoading} />;
  }, [debouncedSupplyAmount, position, vault, isPositionLoading]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <fieldset disabled={simulating} style={{ all: "unset", width: "100%" }}>
          <div className="flex flex-col gap-6">
            <AssetInputFormField
              control={form.control}
              name="supplyAmount"
              header={`Supply ${vault.asset.symbol}`}
              asset={vault.asset}
              maxValue={walletUnderlyingAssetBalance}
              setIsMax={(isMax) => {
                form.setValue("isMaxSupply", isMax);
              }}
            />

            {simulationMetrics}

            <div className="flex flex-col gap-1">
              <Button
                type="submit"
                disabled={simulating || !form.formState.isValid}
                isLoading={simulating}
                loadingMessage="Simulating"
              >
                Review Supply
              </Button>
              <ErrorMessage message={simulationErrorMsg} />
            </div>
          </div>
        </fieldset>
      </form>
    </Form>
  );
}
