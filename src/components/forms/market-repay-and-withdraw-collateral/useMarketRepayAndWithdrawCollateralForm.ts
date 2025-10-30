"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { type MarketId, MathLib } from "@morpho-org/blue-sdk";
import { useModal } from "connectkit";
import { useCallback, useEffect, useMemo } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
import { useDebounce } from "use-debounce";
import { type Hex, maxUint256 } from "viem";
import { useAccount, usePublicClient } from "wagmi";

import { type MarketAction, marketRepayAndWithdrawCollateralAction, UserFacingError } from "@/actions";
import type { SupportedChainId } from "@/config/types";
import type { MarketNonIdle } from "@/data/whisk/getMarket";
import type { MarketPosition } from "@/data/whisk/getMarketPositions";
import { useMarketPosition } from "@/hooks/useMarketPositions";
import { DEBOUNCE_TIME_MS } from "@/utils/constants";
import { computeMarketPositonChange, computeRequiredCollateral } from "@/utils/math";
import { parseOnchainAmount } from "@/utils/schemas";
import { tryCatch } from "@/utils/tryCatch";
import {
  createMarketRepayAndWithdrawCollateralFormSchema,
  type MarketRepayAndWithdrawCollateralFormSchemaInput,
  type MarketRepayAndWithdrawCollateralFormSchemaOutput,
} from "./schema";

interface UseMarketRepayAndWithdrawCollateralFormParams {
  market: MarketNonIdle;
  onSuccessfulActionSimulation: (action: MarketAction) => void;
}

export function useMarketRepayAndWithdrawCollateralForm({
  market,
  onSuccessfulActionSimulation,
}: UseMarketRepayAndWithdrawCollateralFormParams) {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: market.chain.id });
  const { setOpen: setConnectKitOpen } = useModal();

  const { data: position, isLoading: isPositionLoading } = useMarketPosition(
    market.chain.id as SupportedChainId,
    market.marketId as Hex,
  );

  const formSchema = useMemo(
    () => createMarketRepayAndWithdrawCollateralFormSchema(market, position),
    [market, position],
  );

  const form = useForm<
    MarketRepayAndWithdrawCollateralFormSchemaInput,
    undefined,
    MarketRepayAndWithdrawCollateralFormSchemaOutput
  >({
    mode: "onChange",
    resolver: standardSchemaResolver(formSchema),
    defaultValues: {
      repayAmount: "",
      isMaxRepay: false,
      withdrawCollateralAmount: "",
    },
  });

  const handleSubmit = useCallback(
    async (submittedValues: MarketRepayAndWithdrawCollateralFormSchemaOutput) => {
      // Clear any root errors we set in the previous submit
      form.clearErrors("root");

      if (!position) {
        return;
      }

      if (!address) {
        setConnectKitOpen(true);
        return;
      }

      if (!publicClient) {
        form.setError("root", { message: `Missing client for chain ${market.chain.id}` });
        return;
      }

      const isMaxRepay = submittedValues.repayAmount > 0n && submittedValues.isMaxRepay;

      // No interest accrual, so okay to handle with direct comparison
      // Complex to handle with isMax flag becuase depends on position health
      const isMaxWithdrawCollateral =
        submittedValues.withdrawCollateralAmount > 0n &&
        submittedValues.withdrawCollateralAmount === BigInt(position.collateralAmount?.raw ?? 0);

      const { data: action, error } = await tryCatch(
        marketRepayAndWithdrawCollateralAction({
          publicClient,
          marketId: market.marketId as MarketId,
          accountAddress: address,
          repayAmount: isMaxRepay ? maxUint256 : submittedValues.repayAmount,
          withdrawCollateralAmount: isMaxWithdrawCollateral ? maxUint256 : submittedValues.withdrawCollateralAmount,
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
    [
      address,
      setConnectKitOpen,
      publicClient,
      market,
      onSuccessfulActionSimulation,
      form.setError,
      form.clearErrors,
      position,
    ],
  );

  const derivedFormValues = useDerivedFormValues({
    market,
    position,
    form,
  });

  // Trigger dependent field validation
  useEffect(() => {
    const subscription = form.watch((_value, { name }) => {
      if (name === "repayAmount") {
        void form.trigger(["withdrawCollateralAmount"]);
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

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
      form.setValue("isMaxRepay", false);
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
  market,
  position,
  form,
}: {
  market: MarketNonIdle;
  position?: MarketPosition;
  form: UseFormReturn<
    MarketRepayAndWithdrawCollateralFormSchemaInput,
    undefined,
    MarketRepayAndWithdrawCollateralFormSchemaOutput
  >;
}) {
  const [formInputRepayAmount, formInputIsMaxRepay, formInputWithdrawCollateralAmount] = form.watch([
    "repayAmount",
    "isMaxRepay",
    "withdrawCollateralAmount",
  ]);

  const [debouncedFormInputRepayAmount] = useDebounce(formInputRepayAmount, DEBOUNCE_TIME_MS);
  const [debouncedFormInputWithdrawCollateralAmount] = useDebounce(formInputWithdrawCollateralAmount, DEBOUNCE_TIME_MS);

  const repayAmount = useMemo(() => {
    if (formInputIsMaxRepay && position?.borrowAmount != null) {
      return BigInt(position.borrowAmount.raw);
    }
    return parseOnchainAmount(debouncedFormInputRepayAmount, market.loanAsset.decimals) ?? 0n;
  }, [debouncedFormInputRepayAmount, market.loanAsset.decimals, formInputIsMaxRepay, position]);

  const withdrawCollateralAmount = useMemo(() => {
    return parseOnchainAmount(debouncedFormInputWithdrawCollateralAmount, market.collateralAsset.decimals) ?? 0n;
  }, [debouncedFormInputWithdrawCollateralAmount, market.collateralAsset.decimals]);

  const maxWithdrawCollateralAmount = useMemo(() => {
    const requiredCollateral = computeRequiredCollateral(market, -repayAmount, position);
    return MathLib.max(BigInt(position?.collateralAmount?.raw ?? 0n) - requiredCollateral, 0n);
  }, [position, market, repayAmount]);

  const positionChange = useMemo(() => {
    return computeMarketPositonChange({
      market,
      currentPosition: position,
      collateralAmountChange: -withdrawCollateralAmount,
      loanAmountChange: -repayAmount,
    });
  }, [market, position, withdrawCollateralAmount, repayAmount]);

  return {
    maxWithdrawCollateralAmount,
    positionChange,
    missingAmount: repayAmount === 0n && withdrawCollateralAmount === 0n,
  };
}
