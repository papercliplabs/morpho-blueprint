"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { MarketId } from "@morpho-org/blue-sdk";
import { useModal } from "connectkit";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDebounce } from "use-debounce";
import { type Hex, maxUint256, parseUnits } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import type { z } from "zod";
import { marketRepayAndWithdrawCollateralAction, type SuccessfulMarketAction } from "@/actions";
import type { SupportedChainId } from "@/config/types";
import type { MarketNonIdle } from "@/data/whisk/getMarket";
import { useMarketPosition } from "@/hooks/useMarketPositions";
import { useWatchNumberInputField } from "@/hooks/useWatchNumberInputField";
import { computeMarketMaxWithdrawCollateral, computeMarketPositonChange } from "@/utils/math";
import { MarketActionSimulationMetrics } from "../ActionFlow/MarketActionFlow";
import { Button } from "../ui/button";
import { ErrorMessage } from "../ui/error-message";
import { Form } from "../ui/form";
import { Separator } from "../ui/seperator";
import { AssetInputFormField } from "./FormFields/AssetInputFormField";
import { createMarketRepayAndWithdrawCollateralFormSchema } from "./schema/market";

interface MarketRepayAndWithdrawCollateralFormProps {
  market: MarketNonIdle;
  onSuccessfulActionSimulation: (action: SuccessfulMarketAction) => void;
}

type RepayLimiter = "wallet-balance" | "position";

export const MarketRepayAndWithdrawCollateralForm = forwardRef<
  { reset: () => void },
  MarketRepayAndWithdrawCollateralFormProps
>(({ market, onSuccessfulActionSimulation }, ref) => {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: market.chain.id });
  const { setOpen: setConnectKitOpen } = useModal();

  const [simulating, setSimulating] = useState(false);
  const [simulationErrorMsg, setSimulationErrorMsg] = useState<string | null>(null);

  const { data: position, isLoading: isPositionLoading } = useMarketPosition(
    market.chain.id as SupportedChainId,
    market.marketId as Hex,
  );

  const { positionBorrowAmountRaw, walletLoanAssetBalanceRaw, repayLimiter } = useMemo(() => {
    if (!position) {
      return {
        positionBorrowAmountRaw: undefined as undefined | bigint,
        walletLoanAssetBalanceRaw: undefined as undefined | bigint,
        repayLimiter: "wallet-balance" as RepayLimiter,
      };
    }

    const positionBorrowAmountRaw = BigInt(position.borrowAmount.raw ?? 0n);
    const walletLoanAssetBalanceRaw = BigInt(position.walletLoanAssetHolding.balance.raw ?? 0n);
    const repayLimiter =
      positionBorrowAmountRaw > walletLoanAssetBalanceRaw ? ("wallet-balance" as RepayLimiter) : "position";

    return {
      positionBorrowAmountRaw,
      walletLoanAssetBalanceRaw,
      repayLimiter,
    };
  }, [position]);

  const formSchema = useMemo(() => {
    return createMarketRepayAndWithdrawCollateralFormSchema({
      loanAsset: market.loanAsset,
      positionBorrowAmountRaw,
    });
  }, [positionBorrowAmountRaw, market]);

  const form = useForm({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      repayAmount: "",
      isMaxRepay: false,
      withdrawCollateralAmount: "",
      isMaxWithdrawCollateral: false,
    },
  });

  // Expose reset method to parent
  useImperativeHandle(ref, () => ({
    reset: () => {
      form.reset();
    },
  }));

  const repayAmount = useWatchNumberInputField(form.control, "repayAmount");
  const withdrawCollateralAmount = useWatchNumberInputField(form.control, "withdrawCollateralAmount");
  const [debouncedRepayAmount] = useDebounce(repayAmount, 300);
  const [debouncedWithdrawCollateralAmount] = useDebounce(withdrawCollateralAmount, 300);

  const maxWithdrawCollateralAmount = useMemo(() => {
    if (!position) {
      return 0n;
    }

    try {
      return parseUnits(
        computeMarketMaxWithdrawCollateral(market, position, repayAmount).toString(),
        market.collateralAsset.decimals,
      );
    } catch {
      console.warn("Failed to compute max withdraw collateral amount", {
        market,
        position,
        repayAmount,
      });
      return 0n;
    }
  }, [position, market, repayAmount]);

  const missingAmountInputs = useMemo(() => {
    return repayAmount === 0 && withdrawCollateralAmount === 0;
  }, [repayAmount, withdrawCollateralAmount]);

  const simulationMetrics = useMemo(() => {
    const positionChange = computeMarketPositonChange({
      market,
      currentPosition: position,
      collateralAmountChange: -debouncedWithdrawCollateralAmount,
      loanAmountChange: -debouncedRepayAmount,
    });

    return (
      <MarketActionSimulationMetrics market={market} positionChange={positionChange} isLoading={isPositionLoading} />
    );
  }, [market, position, debouncedWithdrawCollateralAmount, debouncedRepayAmount, isPositionLoading]);

  // Trigger dependent field validation
  useEffect(() => {
    const subscription = form.watch((_value, { name }) => {
      if (name === "repayAmount" || name === "withdrawCollateralAmount") {
        void form.trigger(["repayAmount", "withdrawCollateralAmount"]);
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const handleSubmit = useCallback(
    async ({
      repayAmount,
      isMaxRepay,
      withdrawCollateralAmount,
      isMaxWithdrawCollateral,
    }: z.infer<typeof formSchema>) => {
      if (!address) {
        setConnectKitOpen(true);
        return;
      }

      if (!publicClient) {
        throw new Error(`Missing public client for chain ${market.chain.id}`);
      }

      setSimulationErrorMsg(null);
      setSimulating(true);

      let rawRepayAmount = parseUnits(repayAmount === "" ? "0" : repayAmount, market.loanAsset.decimals);
      if (rawRepayAmount > 0n && isMaxRepay && repayLimiter === "position") {
        rawRepayAmount = maxUint256;
      }

      let rawWithdrawCollateralAmount = parseUnits(
        withdrawCollateralAmount === "" ? "0" : withdrawCollateralAmount,
        market.collateralAsset.decimals,
      );
      if (
        rawWithdrawCollateralAmount > 0n &&
        isMaxWithdrawCollateral &&
        ((positionBorrowAmountRaw ?? 0n) === 0n || rawRepayAmount === maxUint256)
      ) {
        // Only full withdraw if there is no loan or full repay
        rawWithdrawCollateralAmount = maxUint256;
      }

      const action = await marketRepayAndWithdrawCollateralAction({
        publicClient,
        marketId: market.marketId as MarketId,
        accountAddress: address,
        repayAmount: rawRepayAmount,
        withdrawCollateralAmount: rawWithdrawCollateralAmount,
      });

      if (action.status === "success") {
        onSuccessfulActionSimulation(action);
      } else {
        setSimulationErrorMsg(action.message);
      }

      setSimulating(false);
    },
    [
      address,
      setConnectKitOpen,
      publicClient,
      repayLimiter,
      positionBorrowAmountRaw,
      market,
      onSuccessfulActionSimulation,
    ],
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <fieldset disabled={simulating} style={{ all: "unset", width: "100%" }}>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <AssetInputFormField
                control={form.control}
                name="repayAmount"
                header={`Repay ${market.loanAsset.symbol}`}
                chain={market.chain}
                asset={market.loanAsset}
                maxValue={(() => {
                  const a = positionBorrowAmountRaw ?? 0n;
                  const b = walletLoanAssetBalanceRaw ?? 0n;
                  return a < b ? a : b;
                })()}
                setIsMax={(isMax) => {
                  form.setValue("isMaxRepay", isMax);
                }}
              />
              <AssetInputFormField
                control={form.control}
                name="withdrawCollateralAmount"
                header={`Withdraw ${market.collateralAsset.symbol}`}
                chain={market.chain}
                asset={market.collateralAsset}
                maxValue={maxWithdrawCollateralAmount}
              />
            </div>

            <Separator />

            {simulationMetrics}

            <div className="flex flex-col gap-1">
              <Button
                disabled={simulating || !form.formState.isValid || missingAmountInputs}
                isLoading={simulating}
                loadingMessage="Simulating"
                size="lg"
                type="submit"
              >
                {missingAmountInputs ? "Enter an amount" : "Review"}
              </Button>
              <ErrorMessage message={simulationErrorMsg} />
            </div>
          </div>
        </fieldset>
      </form>
    </Form>
  );
});
MarketRepayAndWithdrawCollateralForm.displayName = "MarketRepayAndWithdrawCollateralForm";
