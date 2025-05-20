"use client";
import { useAppKit } from "@reown/appkit/react";
import { useMemo } from "react";
import { useAccount } from "wagmi";

import { useShallowSearchParams } from "@/hooks/useShallowSearchParams";

import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

import { FilterKey } from "./types";

export function AccountFilters() {
  const {
    values: [accountFilterValues],
    addShallowSearchParams,
  } = useShallowSearchParams({
    keys: [FilterKey.Account],
  });
  const { isConnected } = useAccount();
  const { open: openAppKit } = useAppKit();

  const value = useMemo(() => {
    if (accountFilterValues.length === 0) {
      return "all";
    }
    return accountFilterValues[0];
  }, [accountFilterValues]);

  return (
    <Tabs
      value={isConnected ? value : "all"}
      onValueChange={(value) => addShallowSearchParams([{ key: FilterKey.Account, value }])}
      variant="default"
    >
      <TabsList>
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="positions" onClick={() => !isConnected && openAppKit()}>
          My positions
        </TabsTrigger>
        <TabsTrigger value="wallet" onClick={() => !isConnected && openAppKit()}>
          In wallet
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
