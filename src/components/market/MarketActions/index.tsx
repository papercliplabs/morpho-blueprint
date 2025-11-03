"use client";

import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import type { Hex } from "viem";
import { PoweredByMorpho } from "@/components/PoweredByMorpho";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { SupportedChainId } from "@/config/types";
import type { MarketNonIdle } from "@/data/whisk/getMarket";
import { useMarketPosition } from "@/hooks/useMarketPositions";
import { useResponsiveContext } from "@/providers/ResponsiveProvider";
import MarketRepayAndWithdrawCollateral from "./MarketRepayAndWithdrawCollateral";
import MarketSupplyCollateralAndBorrow from "./MarketSupplyCollateralAndBorrow";

export interface MarketActionsProps {
  market: MarketNonIdle;
}

export default function MarketActions({ market }: MarketActionsProps) {
  const { data: userMarketPosition } = useMarketPosition(market.chain.id as SupportedChainId, market.marketId as Hex);
  const { isDesktop } = useResponsiveContext();

  const hasBorrowPosition = useMemo(() => {
    return (
      BigInt(userMarketPosition?.borrowAmount.raw ?? 0n) > BigInt(0) ||
      BigInt(userMarketPosition?.collateralAmount?.raw ?? 0n) > BigInt(0)
    );
  }, [userMarketPosition]);

  return (
    <div suppressHydrationWarning>
      {isDesktop ? (
        <MarketActionsDesktop market={market} hasBorrowPosition={hasBorrowPosition} />
      ) : (
        <MarketActionsMobile market={market} hasBorrowPosition={hasBorrowPosition} />
      )}
    </div>
  );
}

function MarketActionsDesktop({ market, hasBorrowPosition }: { hasBorrowPosition: boolean } & MarketActionsProps) {
  // Latch if we had a supply position
  const [hadBorrowPosition, setHadBorrowPosition] = useState(false);
  useEffect(() => {
    if (hasBorrowPosition) {
      setHadBorrowPosition(true);
    }
  }, [hasBorrowPosition]);

  const disableRepayTab = !hadBorrowPosition;

  return (
    <Card className="w-[364px]">
      <Tabs defaultValue="borrow" variant="underline" className="flex flex-col gap-6">
        <div className="w-full border-b">
          <TabsList className="w-fit">
            <TabsTrigger value="borrow">Borrow</TabsTrigger>
            <Tooltip>
              <TooltipTrigger>
                <TabsTrigger
                  value="repay"
                  disabled={disableRepayTab}
                  className={clsx(disableRepayTab && "!cursor-not-allowed")}
                >
                  Repay
                </TabsTrigger>
              </TooltipTrigger>
              {disableRepayTab && (
                <TooltipContent>
                  <p>You need to open a borrow position before you can repay.</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TabsList>
        </div>
        <TabsContent value="borrow" className="flex flex-col gap-6">
          <MarketSupplyCollateralAndBorrow market={market} />
          <PoweredByMorpho className="mx-auto text-muted-foreground" />
        </TabsContent>
        <TabsContent value="repay" className="flex flex-col gap-6">
          <MarketRepayAndWithdrawCollateral market={market} />
          <PoweredByMorpho className="mx-auto text-muted-foreground" />
        </TabsContent>
      </Tabs>
    </Card>
  );
}

function MarketActionsMobile({ market, hasBorrowPosition }: { hasBorrowPosition: boolean } & MarketActionsProps) {
  const [supplyCollateralAndBorrowOpen, setSupplyCollateralAndBorrowOpen] = useState(false);
  const [repayAndWithdrawCollateralOpen, setRepayAndWithdrawCollateralOpen] = useState(false);

  return (
    <div className="fixed right-0 bottom-0 left-0 z-[20] flex items-center gap-[10px] border-t bg-background px-6 py-4">
      <Drawer open={supplyCollateralAndBorrowOpen} onOpenChange={setSupplyCollateralAndBorrowOpen}>
        <DrawerTrigger asChild>
          <Button className="flex-1" size="lg">
            Borrow
          </Button>
        </DrawerTrigger>
        <DrawerContent className="flex flex-col gap-6">
          <DrawerTitle>Supply</DrawerTitle>
          <MarketSupplyCollateralAndBorrow
            market={market}
            onFlowClosed={(success) => {
              if (success) {
                // Automically close parent drawer when true (better UX with nested drawers)
                setSupplyCollateralAndBorrowOpen(false);
              }
            }}
          />
        </DrawerContent>
      </Drawer>

      <Drawer open={repayAndWithdrawCollateralOpen} onOpenChange={setRepayAndWithdrawCollateralOpen}>
        <DrawerTrigger asChild>
          <Button className="flex-1" variant="secondary" size="lg" disabled={!hasBorrowPosition}>
            Repay
          </Button>
        </DrawerTrigger>
        <DrawerContent className="flex flex-col gap-6">
          <DrawerTitle>Repay</DrawerTitle>
          <MarketRepayAndWithdrawCollateral
            market={market}
            onFlowClosed={(success) => {
              if (success) {
                // Automically close parent drawer when true (better UX with nested drawers)
                setRepayAndWithdrawCollateralOpen(false);
              }
            }}
          />
        </DrawerContent>
      </Drawer>
    </div>
  );
}
