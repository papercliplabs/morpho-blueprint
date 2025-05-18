"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MarketId } from "@morpho-org/blue-sdk";
import { useAppKit } from "@reown/appkit/react";
import { useEffect, useMemo, useState } from "react";
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

export function MarketRepayAndWithdrawCollateralForm({
  market,
  onSuccessfulActionSimulation,
}: MarketRepayAndWithdrawCollateralFormProps) {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: market.chain.id });
  const { open: openAppKit } = useAppKit();

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
        repayAmount: z
          .string()
          .refine(
            (val) => {
              if (val == "") return true; // Allow empty
              const num = Number(val);
              return !isNaN(num) && num <= (positionBorrowAmount != undefined ? positionBorrowAmount : Infinity);
            },
            {
              message: "Exceeds position.",
            }
          )
          .refine(
            (val) => {
              if (val == "") return true; // Allow empty
              const num = Number(val);
              return !isNaN(num) && num <= (walletLoanAssetBalance != undefined ? walletLoanAssetBalance : Infinity);
            },
            {
              message: "Exceeds wallet balance.",
            }
          ),
        isMaxRepay: z.boolean(),
        withdrawCollateralAmount: z.string().refine(
          (val) => {
            if (val === "") return true; // Allow empty
            return !isNaN(Number(val)) && Number(val) >= 0;
          },
          {
            message: "Amount must be ≥ 0.",
          }
        ),
        isMaxWithdrawCollateral: z.boolean(),
      })
      .refine(
        (data) => {
          if (!position) {
            return true;
          }

          const repayAmount = data.repayAmount == "" ? 0 : Number(data.repayAmount);
          const withdrawCollateralAmount =
            data.withdrawCollateralAmount == "" ? 0 : Number(data.withdrawCollateralAmount);

          const maxWithdrawCollateral = computeMarketMaxWithdrawCollateral(market, position, repayAmount);

          return withdrawCollateralAmount <= maxWithdrawCollateral;
        },
        {
          message: "Causes unhealthy position.",
          path: ["withdrawCollateralAmount"],
        }
      );
  }, [positionBorrowAmount, walletLoanAssetBalance, position, market]);

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

  async function handleSubmit({
    repayAmount,
    isMaxRepay,
    withdrawCollateralAmount,
    isMaxWithdrawCollateral,
  }: z.infer<typeof formSchema>) {
    if (!address) {
      openAppKit();
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
  }

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

  // Anytime the debouncedRepayAmount changes, trigger the withdrawCollateralAmount validation since it depends on it
  useEffect(() => {
    form.trigger("withdrawCollateralAmount");
  }, [debouncedRepayAmount, form]);

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
                asset={market.collateralAsset}
                maxValue={maxWithdrawCollateralAmount}
              />
            </div>

            <Separator />

            {simulationMetrics}

            <div className="flex flex-col gap-1">
              <Button
                type="submit"
                disabled={simulating || !form.formState.isValid || missingAmountInputs}
                isLoading={simulating}
                loadingMessage="Simulating"
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
}
