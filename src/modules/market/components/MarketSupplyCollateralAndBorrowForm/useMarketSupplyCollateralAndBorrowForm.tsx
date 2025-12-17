import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { type MarketId, MathLib } from "@morpho-org/blue-sdk";
import { useModal } from "connectkit";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
import { useDebounce } from "use-debounce";
import { getAddress, type Hex, maxUint256 } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { type MarketAction, marketSupplyCollateralAndBorrowAction, UserFacingError } from "@/actions";
import { DEBOUNCE_TIME_MS } from "@/common/utils/constants";
import { parseOnchainAmount } from "@/common/utils/schemas";
import { tryCatch } from "@/common/utils/tryCatch";
import type { SupportedChainId } from "@/config/types";
import type { MarketNonIdle } from "@/modules/market/data/getMarket";
import type { MarketPosition } from "@/modules/market/data/getMarketPositions";
import { useMarketPosition } from "@/modules/market/hooks/useMarketPositions";
import { computeMarketPositonChange } from "@/modules/market/utils/computeMarketPositionChange";
import { computeMaxBorrow } from "@/modules/market/utils/computeMaxBorrow";
import {
  createMarketSupplyCollateralAndBorrowFormSchema,
  type MarketSupplyCollateralAndBorrowFormSchemaInput,
  type MarketSupplyCollateralAndBorrowFormSchemaOutput,
} from "./schema";

interface UseMarketSupplyCollateralAndBorrowFormParams {
  market: MarketNonIdle;
  onSuccessfulActionSimulation: (action: MarketAction) => void;
}

export function useMarketSupplyCollateralAndBorrowForm({
  market,
  onSuccessfulActionSimulation,
}: UseMarketSupplyCollateralAndBorrowFormParams) {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: market.chain.id });
  const { setOpen: setConnectKitOpen } = useModal();
  const [submitErrorMsg, setSubmitErrorMsg] = useState<string | null>(null);

  const { data: position, isLoading: isPositionLoading } = useMarketPosition(
    market.chain.id as SupportedChainId,
    market.marketId as Hex,
  );

  const formSchema = useMemo(() => {
    return createMarketSupplyCollateralAndBorrowFormSchema(market, position);
  }, [market, position]);

  const form = useForm<
    MarketSupplyCollateralAndBorrowFormSchemaInput,
    undefined,
    MarketSupplyCollateralAndBorrowFormSchemaOutput
  >({
    mode: "onChange",
    resolver: standardSchemaResolver(formSchema),
    defaultValues: {
      supplyCollateralAmount: "",
      isMaxSupplyCollateral: false,
      borrowAmount: "",
    },
  });

  const handleSubmit = useCallback(
    async (submittedValues: MarketSupplyCollateralAndBorrowFormSchemaOutput) => {
      // Clear any previous error
      setSubmitErrorMsg(null);

      if (!address) {
        setConnectKitOpen(true);
        return;
      }

      if (!publicClient) {
        setSubmitErrorMsg(`Missing client for chain ${market.chain.id}`);
        return;
      }

      let supplyCollateralAmount = submittedValues.supplyCollateralAmount;
      if (submittedValues.supplyCollateralAmount > 0n && submittedValues.isMaxSupplyCollateral) {
        supplyCollateralAmount = maxUint256;
      }

      const { data: action, error } = await tryCatch(
        marketSupplyCollateralAndBorrowAction({
          publicClient,
          marketId: market.marketId as MarketId,
          accountAddress: address,
          collateralAmount: supplyCollateralAmount,
          borrowAmount: submittedValues.borrowAmount,
          allocatingVaultAddresses: market.vaultAllocations.map((v) => getAddress(v.vault.vaultAddress)),
        }),
      );

      if (error) {
        setSubmitErrorMsg(error instanceof UserFacingError ? error.message : "An unknown error occurred");
      } else {
        onSuccessfulActionSimulation(action);
      }
    },
    [address, setConnectKitOpen, publicClient, market, onSuccessfulActionSimulation],
  );

  const derivedFormValues = useDerivedFormValues({
    market,
    position,
    form,
  });

  // Trigger dependent field validation
  useEffect(() => {
    const subscription = form.watch((_value, { name }) => {
      if (name === "supplyCollateralAmount") {
        void form.trigger(["borrowAmount"]);
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
      form.setValue("isMaxSupplyCollateral", false);
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
  market,
  position,
  form,
}: {
  market: MarketNonIdle;
  position?: MarketPosition;
  form: UseFormReturn<
    MarketSupplyCollateralAndBorrowFormSchemaInput,
    undefined,
    MarketSupplyCollateralAndBorrowFormSchemaOutput
  >;
}) {
  const [formInputSupplyCollateralAmount, formInputIsMaxSupplyCollateral, formInputBorrowAmount] = form.watch([
    "supplyCollateralAmount",
    "isMaxSupplyCollateral",
    "borrowAmount",
  ]);

  const [debouncedFormInputSupplyCollateralAmount] = useDebounce(formInputSupplyCollateralAmount, DEBOUNCE_TIME_MS);
  const [debouncedFormInputBorrowAmount] = useDebounce(formInputBorrowAmount, DEBOUNCE_TIME_MS);

  const supplyCollateralAmount = useMemo(() => {
    const parsedAmount =
      parseOnchainAmount(debouncedFormInputSupplyCollateralAmount, market.collateralAsset.decimals) ?? 0n;
    if (parsedAmount > 0n && formInputIsMaxSupplyCollateral && position?.walletCollateralAssetHolding != null) {
      return BigInt(position.walletCollateralAssetHolding.balance.raw);
    }
    return parsedAmount;
  }, [
    debouncedFormInputSupplyCollateralAmount,
    market.collateralAsset.decimals,
    formInputIsMaxSupplyCollateral,
    position,
  ]);

  const borrowAmount = useMemo(() => {
    return parseOnchainAmount(debouncedFormInputBorrowAmount, market.loanAsset.decimals) ?? 0n;
  }, [debouncedFormInputBorrowAmount, market.loanAsset.decimals]);

  const maxBorrowable = useMemo(() => {
    const maxBorrowAmount = computeMaxBorrow(market, supplyCollateralAmount, position);
    return MathLib.max(maxBorrowAmount - BigInt(position?.borrowAmount?.raw ?? 0), 0n);
  }, [position, market, supplyCollateralAmount]);

  const positionChange = useMemo(() => {
    return computeMarketPositonChange({
      market,
      currentPosition: position,
      collateralAmountChange: supplyCollateralAmount,
      loanAmountChange: borrowAmount,
    });
  }, [market, position, supplyCollateralAmount, borrowAmount]);

  return {
    maxBorrowable,
    positionChange,
    missingAmount: supplyCollateralAmount === 0n && borrowAmount === 0n,
  };
}
