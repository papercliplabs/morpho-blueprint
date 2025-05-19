"use client";

import { useEffect, useMemo, useState } from "react";
import { Hex } from "viem";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { PoweredByMorpho } from "@/components/ui/icons/PoweredByMorpho";
import { Tabs } from "@/components/ui/tabs";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketNonIdle } from "@/data/whisk/getMarket";
import { useMarketPosition } from "@/hooks/useMarketPositions";
import { useResponsiveContext } from "@/providers/ResponsiveProvider";

import MarketRepayAndWithdrawCollateral from "./MarketRepayAndWithdrawCollateral";
import MarketSupplyCollateralAndBorrow from "./MarketSupplyCollateralAndBorrow";

export interface MarketActionsProps {
  market: MarketNonIdle;
}

export default function MarketActions({ market }: MarketActionsProps) {
  const { data: userMarketPosition } = useMarketPosition(market.chain.id, market.marketId as Hex);
  const { isDesktop, hasMounted } = useResponsiveContext();

  const hasBorrowPosition = useMemo(() => {
    return BigInt(userMarketPosition?.borrowAssets ?? 0) > BigInt(0);
  }, [userMarketPosition]);

  // Wait to render until we know to prevent layout glitches
  if (!hasMounted) {
    return null;
  }

  if (isDesktop) {
    return <MarketActionsDesktop market={market} hasBorrowPosition={hasBorrowPosition} />;
  } else {
    return <MarketActionsMobile market={market} hasBorrowPosition={hasBorrowPosition} />;
  }
}

function MarketActionsDesktop({ market, hasBorrowPosition }: { hasBorrowPosition: boolean } & MarketActionsProps) {
  // Latch if we had a supply position
  const [hadBorrowPosition, setHadBorrowPosition] = useState(false);
  useEffect(() => {
    if (hasBorrowPosition) {
      setHadBorrowPosition(true);
    }
  }, [hasBorrowPosition]);

  return (
    <Card className="w-[364px]">
      <Tabs defaultValue="borrow" variant="underline" className="flex flex-col gap-6">
        <div className="w-full border-b">
          <TabsList className="w-fit">
            <TabsTrigger value="borrow">Borrow</TabsTrigger>
            {hadBorrowPosition && <TabsTrigger value="repay">Repay</TabsTrigger>}
          </TabsList>
        </div>
        <TabsContent value="borrow" className="flex flex-col gap-6">
          <MarketSupplyCollateralAndBorrow market={market} />
          <PoweredByMorpho className="mx-auto" />
        </TabsContent>
        <TabsContent value="repay" className="flex flex-col gap-6">
          <MarketRepayAndWithdrawCollateral market={market} />
          <PoweredByMorpho className="mx-auto" />
        </TabsContent>
      </Tabs>
    </Card>
  );
}

function MarketActionsMobile({ market, hasBorrowPosition }: { hasBorrowPosition: boolean } & MarketActionsProps) {
  const [supplyCollateralAndBorrowOpen, setSupplyCollateralAndBorrowOpen] = useState(false);
  const [repayAndWithdrawCollateralOpen, setRepayAndWithdrawCollateralOpen] = useState(false);

  return (
    <div className="bg-background fixed right-0 bottom-0 left-0 z-[20] flex items-center gap-[10px] border-t px-6 py-4">
      <Drawer open={supplyCollateralAndBorrowOpen} onOpenChange={setSupplyCollateralAndBorrowOpen}>
        <DrawerTrigger asChild>
          <Button className="flex-1">Borrow</Button>
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
          <Button className="flex-1" variant="secondary" disabled={!hasBorrowPosition}>
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
