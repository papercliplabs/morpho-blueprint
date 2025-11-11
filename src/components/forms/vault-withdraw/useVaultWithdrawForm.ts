import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useModal } from "connectkit";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
import { useDebounce } from "use-debounce";
import { getAddress, maxUint256 } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { UserFacingError, type VaultAction } from "@/actions";
import { erc4626WithdrawAction } from "@/actions/erc4626/withdraw/erc4626WithdrawAction";
import type { SupportedChainId } from "@/config/types";
import type { Vault } from "@/data/whisk/getVault";
import type { VaultPosition } from "@/data/whisk/getVaultPositions";
import { useVaultPosition } from "@/hooks/useVaultPositions";
import { DEBOUNCE_TIME_MS } from "@/utils/constants";
import { computeVaultPositionChange } from "@/utils/math";
import { parseOnchainAmount } from "@/utils/schemas";
import { tryCatch } from "@/utils/tryCatch";
import {
  createVaultWithdrawFormSchema,
  type VaultWithdrawFormSchemaInput,
  type VaultWithdrawFormSchemaOutput,
} from "./schema";

interface UseVaultWithdrawFormParamters {
  vault: Vault;
  onSuccessfulActionSimulation: (action: VaultAction) => void;
}

export function useVaultWithdrawForm({ vault, onSuccessfulActionSimulation }: UseVaultWithdrawFormParamters) {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: vault.chain.id });
  const { setOpen: setConnectKitOpen } = useModal();
  const [submitErrorMsg, setSubmitErrorMsg] = useState<string | null>(null);

  const { data: position, isLoading: isPositionLoading } = useVaultPosition(
    vault.chain.id as SupportedChainId,
    getAddress(vault.vaultAddress),
  );

  const formSchema = useMemo(() => {
    return createVaultWithdrawFormSchema(
      vault.asset.decimals,
      position != null ? BigInt(position.supplyAmount.raw) : undefined,
    );
  }, [vault.asset.decimals, position]);

  const form = useForm<VaultWithdrawFormSchemaInput, undefined, VaultWithdrawFormSchemaOutput>({
    mode: "onChange",
    resolver: standardSchemaResolver(formSchema),
    defaultValues: {
      withdrawAmount: "",
      isMaxWithdraw: false,
    },
  });

  const handleSubmit = useCallback(
    async (submittedValues: VaultWithdrawFormSchemaOutput) => {
      // Clear any root errors we set in the previous submit
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
        erc4626WithdrawAction({
          client: publicClient,
          vaultAddress: getAddress(vault.vaultAddress),
          accountAddress: address,
          withdrawAmount: submittedValues.isMaxWithdraw ? maxUint256 : submittedValues.withdrawAmount,
          unwrapNativeAssets: false, // TODO: wire this up
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
      form.setValue("isMaxWithdraw", false);
    }
  }, [address, form.setValue]);

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
}: {
  vault: Vault;
  position?: VaultPosition;
  form: UseFormReturn<VaultWithdrawFormSchemaInput, undefined, VaultWithdrawFormSchemaOutput>;
}) {
  const [formInputWithdrawAmount, formInputIsMaxWithdraw] = form.watch(["withdrawAmount", "isMaxWithdraw"]);

  const [debouncedFormInputWithdrawAmount] = useDebounce(formInputWithdrawAmount, DEBOUNCE_TIME_MS);

  const withdrawAmount = useMemo(() => {
    if (formInputIsMaxWithdraw && position?.supplyAmount.raw != null) {
      return BigInt(position.supplyAmount.raw);
    }
    return parseOnchainAmount(debouncedFormInputWithdrawAmount, vault.asset.decimals) ?? 0n;
  }, [debouncedFormInputWithdrawAmount, vault.asset.decimals, formInputIsMaxWithdraw, position?.supplyAmount.raw]);

  const positionChange = useMemo(() => {
    return computeVaultPositionChange({
      currentPosition: position,
      supplyAmountChange: -withdrawAmount,
    });
  }, [withdrawAmount, position]);

  return {
    positionChange,
    missingAmount: withdrawAmount === 0n,
  };
}
