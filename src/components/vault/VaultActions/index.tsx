"use client";

import { useEffect, useMemo, useState } from "react";
import { getAddress } from "viem";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { PoweredByMorpho } from "@/components/ui/icons/PoweredByMorpho";
import { Tabs } from "@/components/ui/tabs";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Vault } from "@/data/whisk/getVault";
import { useVaultPosition } from "@/hooks/useVaultPositions";
import { useResponsiveContext } from "@/providers/ResponsiveProvider";

import VaultSupply from "./VaultSupply";
import VaultWithdraw from "./VaultWithdraw";

export interface VaultActionsProps {
  vault: Vault;
}

export function ClientOnly({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}

export function VaultActions({ vault }: VaultActionsProps) {
  const { isDesktop } = useResponsiveContext();
  const { data: userVaultPosition } = useVaultPosition(vault.chain.id, getAddress(vault.vaultAddress));

  const hasSupplyPosition = useMemo(() => {
    return BigInt(userVaultPosition?.supplyAssets ?? 0) > BigInt(0);
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

function VaultActionsDesktop({ vault, hasSupplyPosition }: { hasSupplyPosition: boolean } & VaultActionsProps) {
  // Latch if we had a supply position
  const [hadSupplyPosition, setHadSupplyPosition] = useState(false);
  useEffect(() => {
    if (hasSupplyPosition) {
      setHadSupplyPosition(true);
    }
  }, [hasSupplyPosition]);

  return (
    <Card className="h-fit w-[364px] shrink-0">
      <Tabs defaultValue="supply" variant="underline" className="flex flex-col gap-6">
        <div className="w-full border-b">
          <TabsList className="w-fit">
            <TabsTrigger value="supply">Supply</TabsTrigger>
            {hadSupplyPosition && <TabsTrigger value="withdraw">Withdraw</TabsTrigger>}
          </TabsList>
        </div>
        <TabsContent value="supply" className="flex flex-col gap-6">
          <VaultSupply vault={vault} />
          <PoweredByMorpho className="mx-auto" />
        </TabsContent>
        <TabsContent value="withdraw" className="flex flex-col gap-6">
          <VaultWithdraw vault={vault} />
          <PoweredByMorpho className="mx-auto" />
        </TabsContent>
      </Tabs>
    </Card>
  );
}

function VaultActionsMobile({ vault, hasSupplyPosition }: { hasSupplyPosition: boolean } & VaultActionsProps) {
  const [supplyOpen, setSupplyOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  return (
    <div className="bg-background fixed right-0 bottom-0 left-0 z-[20] flex items-center gap-[10px] border-t px-6 py-4">
      <Drawer open={supplyOpen} onOpenChange={setSupplyOpen}>
        <DrawerTrigger asChild>
          <Button className="flex-1">Supply</Button>
        </DrawerTrigger>
        <DrawerContent className="flex flex-col gap-6">
          <DrawerTitle>Supply</DrawerTitle>
          <VaultSupply
            vault={vault}
            onFlowClosed={(success) => {
              if (success) {
                // Automically close parent drawer when true (better UX with nested drawers)
                setSupplyOpen(false);
              }
            }}
          />
          <PoweredByMorpho className="mx-auto" />
        </DrawerContent>
      </Drawer>

      <Drawer open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DrawerTrigger asChild>
          <Button className="flex-1" variant="secondary" disabled={!hasSupplyPosition}>
            Withdraw
          </Button>
        </DrawerTrigger>
        <DrawerContent className="flex flex-col gap-6">
          <DrawerTitle>Withdraw</DrawerTitle>
          <VaultWithdraw
            vault={vault}
            onFlowClosed={(success) => {
              if (success) {
                // Automically close parent drawer when true (better UX with nested drawers)
                setWithdrawOpen(false);
              }
            }}
          />
          <PoweredByMorpho className="mx-auto" />
        </DrawerContent>
      </Drawer>
    </div>
  );
}
