"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MarketId } from "@morpho-org/blue-sdk";
import { useModal } from "connectkit";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDebounce } from "use-debounce";
import { Hex, getAddress, maxUint256, parseUnits } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { z } from "zod";

import { SuccessfulMarketAction, marketSupplyCollateralAndBorrowAction } from "@/actions";
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

export const MarketSupplyCollateralAndBorrowForm = forwardRef<
  { reset: () => void },
  MarketSupplyCollateralAndBorrowFormProps
>(({ market, onSuccessfulActionSimulation }, ref) => {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: market.chain.id });
  const { setOpen: setConnectKitOpen } = useModal();

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
        supplyCollateralAmount: z.string(),
        isMaxSupplyCollateral: z.boolean(),
        borrowAmount: z.string(),
      })
      .superRefine((data, ctx) => {
        const supplyCollateralAmount = isNaN(Number(data.supplyCollateralAmount))
          ? 0
          : Number(data.supplyCollateralAmount);
        const borrowAmount = isNaN(Number(data.borrowAmount)) ? 0 : Number(data.borrowAmount);

        if (supplyCollateralAmount <= 0 && borrowAmount <= 0) {
          ctx.addIssue({
            path: ["supplyCollateralAmount"],
            code: z.ZodIssueCode.custom,
            message: "One amount is required.",
          });
          ctx.addIssue({
            path: ["borrowAmount"],
            code: z.ZodIssueCode.custom,
            message: "One amount is required.",
          });
        }

        const maxSupplyCollateralAmount = walletCollateralAssetBalance ?? Infinity;
        if (supplyCollateralAmount > maxSupplyCollateralAmount) {
          ctx.addIssue({
            path: ["supplyCollateralAmount"],
            code: z.ZodIssueCode.custom,
            message: "Amount exceeds wallet balance.",
          });
        }

        if (position) {
          const maxBorrowAmount = computeAvailableToBorrow(market, position, supplyCollateralAmount, 0);
          if (borrowAmount > maxBorrowAmount) {
            ctx.addIssue({
              path: ["borrowAmount"],
              code: z.ZodIssueCode.custom,
              message: "Exceeds max borrow.",
            });
          }
        }
      });
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

  // Expose reset method to parent
  useImperativeHandle(ref, () => ({
    reset: () => {
      form.reset();
    },
  }));

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

  // Trigger dependent field validation
  useEffect(() => {
    const subscription = form.watch((_value, { name }) => {
      if (name === "supplyCollateralAmount" || name === "borrowAmount") {
        void form.trigger(["supplyCollateralAmount", "borrowAmount"]);
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const handleSubmit = useCallback(
    async ({ supplyCollateralAmount, isMaxSupplyCollateral, borrowAmount }: z.infer<typeof formSchema>) => {
      if (!address) {
        setConnectKitOpen(true);
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
    },
    [
      address,
      setConnectKitOpen,
      publicClient,
      setSimulationErrorMsg,
      setSimulating,
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
                name="supplyCollateralAmount"
                header={`Add ${market.collateralAsset.symbol}`}
                chain={market.chain}
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
                chain={market.chain}
                asset={market.loanAsset}
                maxValue={maxBorrowAmount}
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
MarketSupplyCollateralAndBorrowForm.displayName = "MarketSupplyCollateralAndBorrowForm";
