"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MarketId } from "@morpho-org/blue-sdk";
import { useModal } from "connectkit";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDebounce } from "use-debounce";
import { Hex, maxUint256, parseUnits } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { z } from "zod";

import { marketRepayAndWithdrawCollateralAction } from "@/actions/market/marketRepayAndWithdrawCollateralAction";
import { SuccessfulMarketAction } from "@/actions/utils/types";
import { MarketNonIdle } from "@/data/whisk/getMarket";
import { useMarketPosition } from "@/hooks/useMarketPositions";
import { useWatchNumberInputField } from "@/hooks/useWatchNumberInputField";
import { descaleBigIntToNumber } from "@/utils/format";
import { computeMarketMaxWithdrawCollateral, computeMarketPositonChange } from "@/utils/math";

import { MarketActionSimulationMetrics } from "../ActionFlow/MarketActionFlow";
import { Button } from "../ui/button";
import { ErrorMessage } from "../ui/error-message";
import { Form } from "../ui/form";
import { Separator } from "../ui/seperator";

import { AssetInputFormField } from "./FormFields/AssetInputFormField";

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

  const { data: position, isLoading: isPositionLoading } = useMarketPosition(market.chain.id, market.marketId as Hex);

  const { positionBorrowAmount, walletLoanAssetBalance, repayLimiter } = useMemo(() => {
    if (!position || !position.borrowAssets || !position.walletLoanAssetHolding) {
      return {
        positionBorrowAmount: undefined,
        walletLoanAssetBalance: undefined,
        repayLimiter: "wallet-balance" as RepayLimiter,
      };
    }

    const positionBorrowAmount = descaleBigIntToNumber(position.borrowAssets, market.loanAsset.decimals);
    const walletLoanAssetBalance = descaleBigIntToNumber(
      position.walletLoanAssetHolding.balance,
      market.loanAsset.decimals
    );
    const repayLimiter =
      positionBorrowAmount > walletLoanAssetBalance ? ("wallet-balance" as RepayLimiter) : "position";

    return {
      positionBorrowAmount,
      walletLoanAssetBalance,
      repayLimiter,
    };
  }, [position, market.loanAsset.decimals]);

  const formSchema = useMemo(() => {
    return z
      .object({
        repayAmount: z.string(),
        isMaxRepay: z.boolean(),
        withdrawCollateralAmount: z.string(),
        isMaxWithdrawCollateral: z.boolean(),
      })
      .superRefine((data, ctx) => {
        const repayAmount = isNaN(Number(data.repayAmount)) ? 0 : Number(data.repayAmount);
        const withdrawCollateralAmount = isNaN(Number(data.withdrawCollateralAmount))
          ? 0
          : Number(data.withdrawCollateralAmount);

        if (repayAmount <= 0 && withdrawCollateralAmount <= 0) {
          ctx.addIssue({
            path: ["repayAmount"],
            code: z.ZodIssueCode.custom,
            message: "One amount is required.",
          });
          ctx.addIssue({
            path: ["withdrawCollateralAmount"],
            code: z.ZodIssueCode.custom,
            message: "One amount is required.",
          });
        }

        const maxRepayAmount =
          repayLimiter == "position" ? (positionBorrowAmount ?? Infinity) : (walletLoanAssetBalance ?? Infinity);
        if (repayAmount > maxRepayAmount) {
          ctx.addIssue({
            path: ["repayAmount"],
            code: z.ZodIssueCode.custom,
            message: repayLimiter == "position" ? "Exceeds position." : "Exceeds wallet balance.",
          });
        }

        if (position) {
          const maxWithdrawCollateralAmount = computeMarketMaxWithdrawCollateral(market, position, repayAmount);
          if (withdrawCollateralAmount > maxWithdrawCollateralAmount) {
            ctx.addIssue({
              path: ["withdrawCollateralAmount"],
              code: z.ZodIssueCode.custom,
              message: "Causes unhealthy position.",
            });
          }
        }
      });
  }, [positionBorrowAmount, walletLoanAssetBalance, position, repayLimiter, market]);

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
      return 0;
    }
    return computeMarketMaxWithdrawCollateral(market, position, repayAmount);
  }, [position, market, repayAmount]);

  const missingAmountInputs = useMemo(() => {
    return repayAmount == 0 && withdrawCollateralAmount == 0;
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

      let rawRepayAmount = parseUnits(repayAmount == "" ? "0" : repayAmount, market.loanAsset.decimals);
      if (rawRepayAmount > 0n && isMaxRepay && repayLimiter == "position") {
        rawRepayAmount = maxUint256;
      }

      let rawWithdrawCollateralAmount = parseUnits(
        withdrawCollateralAmount == "" ? "0" : withdrawCollateralAmount,
        market.collateralAsset.decimals
      );
      if (
        rawWithdrawCollateralAmount > 0n &&
        isMaxWithdrawCollateral &&
        (positionBorrowAmount == 0 || rawRepayAmount == maxUint256)
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

      if (action.status == "success") {
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
      setSimulationErrorMsg,
      setSimulating,
      repayLimiter,
      positionBorrowAmount,
      market,
      onSuccessfulActionSimulation,
    ]
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
                maxValue={Math.min(
                  positionBorrowAmount ?? Number.MAX_VALUE,
                  walletLoanAssetBalance ?? Number.MAX_VALUE
                )}
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
