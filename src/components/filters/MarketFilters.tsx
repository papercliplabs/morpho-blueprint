"use client";
import { useCallback } from "react";

import { useShallowSearchParams } from "@/hooks/useShallowSearchParams";

import { MultiSelect, type MultiSelectOption } from "../MultiSelect";

import { ResetFiltersButton } from "./ResetFiltersButton";
import { FilterKey } from "./types";

interface MarketFiltersProps {
  chainOptions: MultiSelectOption[];
  collateralAssetOptions: MultiSelectOption[];
  loanAssetOptions: MultiSelectOption[];
}

export function MarketFilters({ chainOptions, collateralAssetOptions, loanAssetOptions }: MarketFiltersProps) {
  const {
    values: [chainValues, collateralAssetValues, loanAssetValues],
    addShallowSearchParams,
    removeShallowSearchParams,
  } = useShallowSearchParams({
    keys: [FilterKey.Chains, FilterKey.CollateralAssets, FilterKey.LoanAssets],
  });

  const onSelect = useCallback(
    (key: string, currentValues: string[], values: string[]) => {
      const itemsToAdd = values.filter((v) => !currentValues.includes(v));
      const itemsToRemove = values.filter((v) => currentValues.includes(v));
      addShallowSearchParams([
        {
          key,
          value: [...currentValues.filter((v) => !itemsToRemove.includes(v)), ...itemsToAdd],
        },
      ]);
    },
    [addShallowSearchParams],
  );

  return (
    <div className="flex gap-4 overflow-x-auto pb-0.5">
      {chainOptions.length > 1 && (
        <MultiSelect
          emptyValue={chainValues === undefined || chainValues.length === 0 ? "All Chains" : "Chains"}
          options={chainOptions}
          value={chainValues ?? []}
          onSelect={(values) => onSelect(FilterKey.Chains, chainValues ?? [], values)}
          onReset={() => removeShallowSearchParams([FilterKey.Chains])}
        />
      )}
      {collateralAssetOptions.length > 1 && (
        <MultiSelect
          emptyValue={
            collateralAssetValues === undefined || collateralAssetValues.length === 0
              ? "All Collateral Assets"
              : "Collateral Assets"
          }
          placeholder="Search for token"
          options={collateralAssetOptions}
          value={collateralAssetValues ?? []}
          onSelect={(values) => onSelect(FilterKey.CollateralAssets, collateralAssetValues ?? [], values)}
          onReset={() => removeShallowSearchParams([FilterKey.CollateralAssets])}
        />
      )}
      {loanAssetOptions.length > 1 && (
        <MultiSelect
          emptyValue={loanAssetValues === undefined || loanAssetValues.length === 0 ? "All Loan Assets" : "Loan Assets"}
          placeholder="Search for token"
          options={loanAssetOptions}
          value={loanAssetValues ?? []}
          onSelect={(values) => onSelect(FilterKey.LoanAssets, loanAssetValues ?? [], values)}
          onReset={() => removeShallowSearchParams([FilterKey.LoanAssets])}
        />
      )}
      <ResetFiltersButton />
    </div>
  );
}
