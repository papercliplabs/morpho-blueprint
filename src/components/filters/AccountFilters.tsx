"use client";
import { useMemo } from "react";

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

  const value = useMemo(() => {
    if (accountFilterValues.length === 0) {
      return "all";
    }
    return accountFilterValues[0];
  }, [accountFilterValues]);

  return (
    <Tabs
      value={value}
      onValueChange={(value) => addShallowSearchParams([{ key: FilterKey.Account, value }])}
      variant="default"
    >
      <TabsList>
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="positions">My positions</TabsTrigger>
        <TabsTrigger value="wallet">In wallet</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
