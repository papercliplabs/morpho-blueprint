"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MarketId } from "@morpho-org/blue-sdk";
import { useAppKit } from "@reown/appkit/react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDebounce } from "use-debounce";
import { Hex, getAddress, maxUint256, parseUnits } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { z } from "zod";

import { marketSupplyCollateralAndBorrowAction } from "@/actions/market/marketSupplyCollateralAndBorrowAction";
import { SuccessfulMarketAction } from "@/actions/utils/types";
import { MarketNonIdle } from "@/data/whisk/getMarket";
import { useMarketPosition } from "@/hooks/useMarketPositions";
import { useWatchNumberInputField } from "@/hooks/useWatchNumberInputField";
import { descaleBigIntToNumber } from "@/utils/format";
import { computeAvailableToBorrow, computeMarketPositonChange } from "@/utils/math";

import { MarketActionSimulationMetrics } from "../ActionFlow/MarketActionFlow";
import { Button } from "../ui/button";
import { ErrorMessage } from "../ui/error-message";
import { Form } from "../ui/form";
import { Separator } from "../ui/seperator";

import { AssetInputFormField } from "./FormFields/AssetInputFormField";

interface MarketSupplyCollateralAndBorrowFormProps {
  market: MarketNonIdle;
  onSuccessfulActionSimulation: (action: SuccessfulMarketAction) => void;
}

export function MarketSupplyCollateralAndBorrowForm({
  market,
  onSuccessfulActionSimulation,
}: MarketSupplyCollateralAndBorrowFormProps) {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: market.chain.id });
  const { open: openAppKit } = useAppKit();

  const [simulating, setSimulating] = useState(false);
  const [simulationErrorMsg, setSimulationErrorMsg] = useState<string | null>(null);

  const { data: position, isLoading: isPositionLoading } = useMarketPosition(market.chain.id, market.marketId as Hex);

  const { walletCollateralAssetBalance } = useMemo(() => {
    if (!position || !position.walletCollateralAssetHolding) {
      return { walletCollateralAssetBalance: undefined, positionBorrowBalance: undefined };
    }

    return {
      walletCollateralAssetBalance: descaleBigIntToNumber(
        position.walletCollateralAssetHolding.balance,
        market.collateralAsset.decimals
      ),
      positionBorrowBalance: descaleBigIntToNumber(position.borrowAssets, market.loanAsset.decimals),
    };
  }, [position, market.collateralAsset.decimals, market.loanAsset.decimals]);

  const formSchema = useMemo(() => {
    return z
      .object({
        supplyCollateralAmount: z.string().refine(
          (val) => {
            if (val == "") return true; // Allow empty

            const num = Number(val);
            return (
              !isNaN(num) &&
              num <= (walletCollateralAssetBalance != undefined ? walletCollateralAssetBalance : Infinity)
            );
          },
          {
            message: "Amount exceeds wallet balance.",
          }
        ),
        isMaxSupplyCollateral: z.boolean(),
        borrowAmount: z.string().refine(
          (val) => {
            if (val === "") return true; // Allow empty
            return !isNaN(Number(val)) && Number(val) >= 0;
          },
          {
            message: "Amount must be ≥ 0.",
          }
        ),
      })
      .refine(
        (data) => {
          if (!position) {
            return true;
          }

          const supplyCollateralAmount = data.supplyCollateralAmount == "" ? 0 : Number(data.supplyCollateralAmount);
          const borrowAmount = data.borrowAmount == "" ? 0 : Number(data.borrowAmount);

          const maxBorrow = computeAvailableToBorrow(market, position, supplyCollateralAmount, 0);
          return borrowAmount <= maxBorrow;
        },
        {
          message: "Exceeds max borrow.",
          path: ["borrowAmount"],
        }
      );
  }, [walletCollateralAssetBalance, position, market]);

  const form = useForm({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplyCollateralAmount: "",
      isMaxSupplyCollateral: false,
      borrowAmount: "",
    },
  });

  async function handleSubmit({
    supplyCollateralAmount,
    isMaxSupplyCollateral,
    borrowAmount,
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

    let rawSupplyCollateralAmount = parseUnits(
      supplyCollateralAmount == "" ? "0" : supplyCollateralAmount,
      market.collateralAsset.decimals
    );
    if (rawSupplyCollateralAmount > 0n && isMaxSupplyCollateral) {
      rawSupplyCollateralAmount = maxUint256;
    }

    const rawBorrowAmount = parseUnits(borrowAmount == "" ? "0" : borrowAmount, market.loanAsset.decimals);

    const action = await marketSupplyCollateralAndBorrowAction({
      publicClient,
      marketId: market.marketId as MarketId,
      accountAddress: address,
      collateralAmount: rawSupplyCollateralAmount,
      borrowAmount: rawBorrowAmount,
      allocatingVaultAddresses: market.vaultAllocations.map((v) => getAddress(v.vault.vaultAddress)),
    });

    if (action.status == "success") {
      onSuccessfulActionSimulation(action);
    } else {
      setSimulationErrorMsg(action.message);
    }

    setSimulating(false);
  }

  const supplyCollateralAmount = useWatchNumberInputField(form.control, "supplyCollateralAmount");
  const borrowAmount = useWatchNumberInputField(form.control, "borrowAmount");
  const [debouncedSupplyCollateralAmount] = useDebounce(supplyCollateralAmount, 300);
  const [debouncedBorrowAmount] = useDebounce(borrowAmount, 300);

  const maxBorrowAmount = useMemo(() => {
    if (!position) {
      return 0;
    }
    return computeAvailableToBorrow(market, position, debouncedSupplyCollateralAmount, 0);
  }, [position, market, debouncedSupplyCollateralAmount]);

  const missingAmountInputs = useMemo(() => {
    return supplyCollateralAmount == 0 && borrowAmount == 0;
  }, [supplyCollateralAmount, borrowAmount]);

  const simulationMetrics = useMemo(() => {
    const positionChange = computeMarketPositonChange({
      market,
      currentPosition: position,
      collateralAmountChange: debouncedSupplyCollateralAmount,
      loanAmountChange: debouncedBorrowAmount,
    });

    return (
      <MarketActionSimulationMetrics market={market} positionChange={positionChange} isLoading={isPositionLoading} />
    );
  }, [market, position, debouncedSupplyCollateralAmount, debouncedBorrowAmount, isPositionLoading]);

  // Anytime the debouncedSupplyCollateralAmount changes, trigger the borrowAmount validation since it depends on it
  useEffect(() => {
    form.trigger("borrowAmount");
  }, [debouncedSupplyCollateralAmount, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <fieldset disabled={simulating} style={{ all: "unset", width: "100%" }}>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <AssetInputFormField
                control={form.control}
                name="supplyCollateralAmount"
                header={`Add ${market.collateralAsset.symbol}`}
                asset={market.collateralAsset}
                maxValue={walletCollateralAssetBalance}
                setIsMax={(isMax) => {
                  form.setValue("isMaxSupplyCollateral", isMax);
                }}
              />
              <AssetInputFormField
                control={form.control}
                name="borrowAmount"
                header={`Borrow ${market.loanAsset.symbol}`}
                asset={market.loanAsset}
                maxValue={maxBorrowAmount}
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
