import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useModal } from "connectkit";
import { useCallback, useEffect, useMemo } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
import { useDebounce } from "use-debounce";
import { getAddress, maxUint256 } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { type SuccessfulVaultAction, vaultWithdrawAction } from "@/actions";
import type { SupportedChainId } from "@/config/types";
import type { Vault } from "@/data/whisk/getVault";
import type { VaultPosition } from "@/data/whisk/getVaultPositions";
import { useVaultPosition } from "@/hooks/useVaultPositions";
import { DEBOUNCE_TIME_MS } from "@/utils/constants";
import { computeVaultPositionChange } from "@/utils/math";
import { parseOnchainAmount } from "@/utils/schemas";
import {
  createVaultWithdrawFormSchema,
  type VaultWithdrawFormSchemaInput,
  type VaultWithdrawFormSchemaOutput,
} from "./schema";

interface UseVaultWithdrawFormParamters {
  vault: Vault;
  onSuccessfulActionSimulation: (action: SuccessfulVaultAction) => void;
}

export function useVaultWithdrawForm({ vault, onSuccessfulActionSimulation }: UseVaultWithdrawFormParamters) {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: vault.chain.id });
  const { setOpen: setConnectKitOpen } = useModal();

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
      form.clearErrors("root");

      if (!address) {
        setConnectKitOpen(true);
        return;
      }

      if (!publicClient) {
        form.setError("root", { message: `Missing client for chain ${vault.chain.id}` });
        return;
      }

      const action = await vaultWithdrawAction({
        publicClient,
        vaultAddress: getAddress(vault.vaultAddress),
        accountAddress: address,
        withdrawAmount: submittedValues.isMaxWithdraw ? maxUint256 : submittedValues.withdrawAmount,
      });

      if (action.status === "success") {
        onSuccessfulActionSimulation(action);
      } else {
        form.setError("root", { message: action.message });
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
      form.setValue("isMaxWithdraw", false);
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
