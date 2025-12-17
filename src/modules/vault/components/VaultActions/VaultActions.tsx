"use client";

import clsx from "clsx";
import { use, useEffect, useMemo, useState } from "react";
import { getAddress } from "viem";
import { PoweredByMorpho } from "@/common/components/PoweredByMorpho";
import { Button } from "@/common/components/ui/button";
import { Card } from "@/common/components/ui/card";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/common/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/common/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/common/components/ui/tooltip";
import { useResponsiveContext } from "@/common/providers/ResponsiveProvider";
import type { Vault } from "@/modules/vault/data/getVault";
import { useVaultPosition } from "@/modules/vault/hooks/useVaultPositions";
import VaultSupply from "./VaultSupply";
import VaultWithdraw from "./VaultWithdraw";

export interface VaultActionsProps {
  vaultPromise: Promise<Vault>;
}

export function VaultActions({ vaultPromise }: VaultActionsProps) {
  const vault = use(vaultPromise);

  const { isDesktop } = useResponsiveContext();
  const { data: userVaultPosition } = useVaultPosition(vault.chain.id, getAddress(vault.vaultAddress));

  const hasSupplyPosition = useMemo(() => {
    return BigInt(userVaultPosition?.assets.raw ?? 0n) > BigInt(0);
  }, [userVaultPosition]);

  return (
    <div suppressHydrationWarning>
      {isDesktop ? (
        <VaultActionsDesktop vault={vault} hasSupplyPosition={hasSupplyPosition} />
      ) : (
        <VaultActionsMobile vault={vault} hasSupplyPosition={hasSupplyPosition} />
      )}
    </div>
  );
}

function VaultActionsDesktop({ vault, hasSupplyPosition }: { hasSupplyPosition: boolean; vault: Vault }) {
  // Latch if we had a supply position
  const [hadSupplyPosition, setHadSupplyPosition] = useState(false);
  useEffect(() => {
    if (hasSupplyPosition) {
      setHadSupplyPosition(true);
    }
  }, [hasSupplyPosition]);

  const disableWithdrawTab = !hadSupplyPosition;

  return (
    <Card className="h-fit w-[364px] shrink-0">
      <Tabs defaultValue="supply" variant="underline" className="flex flex-col gap-6">
        <div className="w-full border-b">
          <TabsList className="w-fit">
            <TabsTrigger value="supply">Supply</TabsTrigger>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <TabsTrigger
                    value="withdraw"
                    disabled={disableWithdrawTab}
                    className={clsx(disableWithdrawTab && "!cursor-not-allowed")}
                  >
                    Withdraw
                  </TabsTrigger>
                </span>
              </TooltipTrigger>
              {disableWithdrawTab && (
                <TooltipContent>
                  <p>You need to open a supply position before you can withdraw.</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TabsList>
        </div>
        <TabsContent value="supply" className="flex flex-col gap-6">
          <VaultSupply vault={vault} />
          <PoweredByMorpho className="mx-auto text-muted-foreground" />
        </TabsContent>
        <TabsContent value="withdraw" className="flex flex-col gap-6">
          <VaultWithdraw vault={vault} />
          <PoweredByMorpho className="mx-auto text-muted-foreground" />
        </TabsContent>
      </Tabs>
    </Card>
  );
}

function VaultActionsMobile({ vault, hasSupplyPosition }: { hasSupplyPosition: boolean; vault: Vault }) {
  const [supplyOpen, setSupplyOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  return (
    <div className="fixed right-0 bottom-0 left-0 z-[20] flex items-center gap-[10px] border-t bg-background px-6 py-4">
      <Drawer open={supplyOpen} onOpenChange={setSupplyOpen}>
        <DrawerTrigger asChild>
          <Button className="flex-1" size="lg">
            Supply
          </Button>
        </DrawerTrigger>
        <DrawerContent className="flex flex-col p-0">
          <div className="p-6">
            <DrawerTitle>Supply</DrawerTitle>
          </div>
          <div className="flex flex-col gap-6 overflow-y-auto px-6 pb-6">
            <VaultSupply
              vault={vault}
              onFlowClosed={(success) => {
                if (success) {
                  // Automically close parent drawer when true (better UX with nested drawers)
                  setSupplyOpen(false);
                }
              }}
            />
            <PoweredByMorpho className="mx-auto text-muted-foreground" />
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DrawerTrigger asChild>
          <Button className="flex-1" variant="secondary" size="lg" disabled={!hasSupplyPosition}>
            Withdraw
          </Button>
        </DrawerTrigger>
        <DrawerContent className="flex flex-col p-0">
          <div className="p-6">
            <DrawerTitle>Withdraw</DrawerTitle>
          </div>
          <div className="flex flex-col gap-6 overflow-y-auto px-6 pb-6">
            <VaultWithdraw
              vault={vault}
              onFlowClosed={(success) => {
                if (success) {
                  // Automically close parent drawer when true (better UX with nested drawers)
                  setWithdrawOpen(false);
                }
              }}
            />
            <PoweredByMorpho className="mx-auto text-muted-foreground" />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
