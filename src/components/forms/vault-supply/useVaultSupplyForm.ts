"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useModal } from "connectkit";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
import { useDebounce } from "use-debounce";
import { getAddress, parseUnits } from "viem";
import { useAccount, useBalance, useEstimateFeesPerGas, usePublicClient } from "wagmi";
import { UserFacingError, type VaultAction } from "@/actions";
import { erc4626SupplyAction } from "@/actions/erc4626/supply/erc4626SupplyAction";
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
import { computeAvailableBalance, isVaultUnderlyingAssetWrappedNativeAsset } from "./utils";

// Buffer to account for gas price fluctuations
const LOW_NATIVE_ASSET_BALANCE_TOLERANCE = parseUnits("0.001", 18);

interface UseVaultSupplyFormParamters {
  vault: Vault;
  onSuccessfulActionSimulation: (action: VaultAction) => void;
}

export function useVaultSupplyForm({ vault, onSuccessfulActionSimulation }: UseVaultSupplyFormParamters) {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: vault.chain.id });
  const { setOpen: setConnectKitOpen } = useModal();
  const [submitErrorMsg, setSubmitErrorMsg] = useState<string | null>(null);

  const { data: position, isLoading: isPositionLoading } = useVaultPosition(
    vault.chain.id as SupportedChainId,
    getAddress(vault.vaultAddress),
  );

  const { data: gasFeeEstimate } = useEstimateFeesPerGas({ chainId: vault.chain.id });
  const { data: accountNativeAssetBalance } = useBalance({ address: address, chainId: vault.chain.id });

  const formSchema = useMemo(() => {
    return createVaultSupplyFormSchema(
      vault,
      position?.walletUnderlyingAssetHolding ? BigInt(position.walletUnderlyingAssetHolding.balance.raw) : undefined,
      accountNativeAssetBalance?.value,
      gasFeeEstimate?.maxFeePerGas,
    );
  }, [vault, position, accountNativeAssetBalance, gasFeeEstimate]);

  const form = useForm<VaultSupplyFormSchemaInput, undefined, VaultSupplyFormSchemaOutput>({
    mode: "onChange",
    resolver: standardSchemaResolver(formSchema),
    defaultValues: {
      supplyAmount: "",
      allowNativeAssetWrapping: false,
    },
  });

  const handleSubmit = useCallback(
    async ({ supplyAmount, allowNativeAssetWrapping }: VaultSupplyFormSchemaOutput) => {
      // Clear any previous error
      setSubmitErrorMsg(null);

      if (!address) {
        setConnectKitOpen(true);
        return;
      }

      if (!publicClient) {
        setSubmitErrorMsg(`Missing client for chain ${vault.chain.id}`);
        return;
      }

      const { data: action, error } = await tryCatch(
        erc4626SupplyAction({
          client: publicClient,
          vaultAddress: getAddress(vault.vaultAddress),
          accountAddress: address,
          supplyAmount,
          allowNativeAssetWrapping,
        }),
      );

      if (error) {
        setSubmitErrorMsg(error instanceof UserFacingError ? error.message : "An unknown error occurred");
      } else {
        onSuccessfulActionSimulation(action);
      }
    },
    [address, setConnectKitOpen, publicClient, vault, onSuccessfulActionSimulation],
  );

  const derivedFormValues = useDerivedFormValues({
    vault,
    position,
    form,
    nativeAssetBalance: accountNativeAssetBalance?.value,
    gasFeeEstimate: gasFeeEstimate?.maxFeePerGas,
  });

  // Trigger revalidation on position change
  // biome-ignore lint/correctness/useExhaustiveDependencies: Allow position to trigger reval
  useEffect(() => {
    if (form.formState.isDirty) {
      form.trigger();
    }
  }, [position, form.trigger]);

  // Trigger amount revalidation when allow native asset wrapping changes
  useEffect(() => {
    const subscription = form.watch((_value, { name }) => {
      if (name === "allowNativeAssetWrapping") {
        void form.trigger(["supplyAmount"]);
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  return {
    form,
    derivedFormValues,
    handleSubmit,
    position,
    isPositionLoading,
    submitErrorMsg,
  };
}

function useDerivedFormValues({
  vault,
  position,
  form,
  nativeAssetBalance,
  gasFeeEstimate,
}: {
  vault: Vault;
  position?: VaultPosition;
  form: UseFormReturn<VaultSupplyFormSchemaInput, undefined, VaultSupplyFormSchemaOutput>;
  nativeAssetBalance?: bigint;
  gasFeeEstimate?: bigint;
}) {
  const formInputSupplyAmount = form.watch("supplyAmount");
  const formInputAllowNativeAssetWrapping = form.watch("allowNativeAssetWrapping");

  // Debounce inputs which can change rapidly
  const [debouncedFormInputSupplyAmount] = useDebounce(formInputSupplyAmount, DEBOUNCE_TIME_MS);

  const supplyAmount = useMemo(() => {
    return parseOnchainAmount(debouncedFormInputSupplyAmount, vault.asset.decimals) ?? 0n;
  }, [debouncedFormInputSupplyAmount, vault.asset.decimals]);

  const positionChange = useMemo(() => {
    return computeVaultPositionChange({
      currentPosition: position,
      supplyAmountChange: supplyAmount,
    });
  }, [supplyAmount, position]);

  const includeNativeAssetWrapping = useMemo(() => {
    return formInputAllowNativeAssetWrapping && isVaultUnderlyingAssetWrappedNativeAsset(vault);
  }, [formInputAllowNativeAssetWrapping, vault]);

  const maxSupplyAmount = useMemo(() => {
    const accountLoanTokenBalance =
      position?.walletUnderlyingAssetHolding?.balance.raw != null
        ? BigInt(position?.walletUnderlyingAssetHolding?.balance.raw)
        : undefined;
    return computeAvailableBalance({
      accountLoanTokenBalance,
      accountNativeAssetBalance: nativeAssetBalance,
      maxFeePerGas: gasFeeEstimate,
      includeNativeAssetWrapping,
    });
  }, [nativeAssetBalance, gasFeeEstimate, position, includeNativeAssetWrapping]);

  const supplyWillLeaveLowNativeAssetBalance = useMemo(() => {
    if (!includeNativeAssetWrapping || maxSupplyAmount === undefined || supplyAmount === undefined) {
      return false;
    }
    return supplyAmount > maxSupplyAmount - LOW_NATIVE_ASSET_BALANCE_TOLERANCE;
  }, [includeNativeAssetWrapping, maxSupplyAmount, supplyAmount]);

  return {
    positionChange,
    missingAmount: supplyAmount === 0n,
    maxSupplyAmount,
    supplyWillLeaveLowNativeAssetBalance,
  };
}
