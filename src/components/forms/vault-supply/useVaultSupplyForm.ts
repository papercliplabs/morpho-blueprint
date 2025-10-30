"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useModal } from "connectkit";
import { useCallback, useEffect, useMemo } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
import { useDebounce } from "use-debounce";
import { getAddress, maxUint256 } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { UserFacingError, type VaultAction, vaultSupplyAction } from "@/actions";
import type { SupportedChainId } from "@/config/types";
import type { Vault } from "@/data/whisk/getVault";
import type { VaultPosition } from "@/data/whisk/getVaultPositions";
import { useVaultPosition } from "@/hooks/useVaultPositions";
import { DEBOUNCE_TIME_MS } from "@/utils/constants";
import { computeVaultPositionChange } from "@/utils/math";
import { parseOnchainAmount } from "@/utils/schemas";
import { tryCatch } from "@/utils/tryCatch";
import {
  createVaultSupplyFormSchema,
  type VaultSupplyFormSchemaInput,
  type VaultSupplyFormSchemaOutput,
} from "./schema";

interface UseVaultSupplyFormParamters {
  vault: Vault;
  onSuccessfulActionSimulation: (action: VaultAction) => void;
}

export function useVaultSupplyForm({ vault, onSuccessfulActionSimulation }: UseVaultSupplyFormParamters) {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: vault.chain.id });
  const { setOpen: setConnectKitOpen } = useModal();

  const { data: position, isLoading: isPositionLoading } = useVaultPosition(
    vault.chain.id as SupportedChainId,
    getAddress(vault.vaultAddress),
  );

  const formSchema = useMemo(() => {
    return createVaultSupplyFormSchema(
      vault.asset.decimals,
      position?.walletUnderlyingAssetHolding ? BigInt(position.walletUnderlyingAssetHolding.balance.raw) : undefined,
    );
  }, [vault.asset.decimals, position]);

  const form = useForm<VaultSupplyFormSchemaInput, undefined, VaultSupplyFormSchemaOutput>({
    mode: "onChange",
    resolver: standardSchemaResolver(formSchema),
    defaultValues: {
      supplyAmount: "",
      isMaxSupply: false,
    },
  });

  const handleSubmit = useCallback(
    async (submittedValues: VaultSupplyFormSchemaOutput) => {
      // Clear any root errors we set in the previous submit
      form.clearErrors("root");

      if (!address) {
        setConnectKitOpen(true);
        return;
      }

      if (!publicClient) {
        form.setError("root", { message: `Missing client for chain ${vault.chain.id}` });
        return;
      }

      const { data: action, error } = await tryCatch(
        vaultSupplyAction({
          publicClient,
          vaultAddress: getAddress(vault.vaultAddress),
          accountAddress: address,
          supplyAmount: submittedValues.isMaxSupply ? maxUint256 : submittedValues.supplyAmount,
          allowWrappingNativeAssets: false, // TODO: revisit
        }),
      );

      if (error) {
        form.setError("root", {
          message: error instanceof UserFacingError ? error.message : "An unknown error occurred",
        });
      } else {
        onSuccessfulActionSimulation(action);
      }
    },
    [address, setConnectKitOpen, publicClient, vault, onSuccessfulActionSimulation, form.setError, form.clearErrors],
  );

  const derivedFormValues = useDerivedFormValues({ vault, position, form });

  // Trigger revalidation on position change
  // biome-ignore lint/correctness/useExhaustiveDependencies: Allow position to trigger reval
  useEffect(() => {
    if (form.formState.isDirty) {
      form.trigger();
    }
  }, [position, form.trigger]);

  // Reset isMax when a new account connects
  useEffect(() => {
    if (address) {
      form.setValue("isMaxSupply", false);
    }
  }, [address, form.setValue]);

  return {
    form,
    derivedFormValues,
    handleSubmit,
    position,
    isPositionLoading,
  };
}

function useDerivedFormValues({
  vault,
  position,
  form,
}: {
  vault: Vault;
  position?: VaultPosition;
  form: UseFormReturn<VaultSupplyFormSchemaInput, undefined, VaultSupplyFormSchemaOutput>;
}) {
  const [formInputSupplyAmount, formInputIsMaxSupply] = form.watch(["supplyAmount", "isMaxSupply"]);

  // Debounce inputs which can change rapidly
  const [debouncedFormInputSupplyAmount] = useDebounce(formInputSupplyAmount, DEBOUNCE_TIME_MS);

  const supplyAmount = useMemo(() => {
    if (formInputIsMaxSupply && position?.walletUnderlyingAssetHolding?.balance.raw != null) {
      return BigInt(position.walletUnderlyingAssetHolding.balance.raw);
    }
    return parseOnchainAmount(debouncedFormInputSupplyAmount, vault.asset.decimals) ?? 0n;
  }, [
    debouncedFormInputSupplyAmount,
    vault.asset.decimals,
    formInputIsMaxSupply,
    position?.walletUnderlyingAssetHolding?.balance.raw,
  ]);

  const positionChange = useMemo(() => {
    return computeVaultPositionChange({
      currentPosition: position,
      supplyAmountChange: supplyAmount,
    });
  }, [supplyAmount, position]);

  return {
    positionChange,
    missingAmount: supplyAmount === 0n,
  };
}
