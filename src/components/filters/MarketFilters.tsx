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
  tokenCategoryOptions: MultiSelectOption[];
}

export function MarketFilters({ chainOptions, collateralAssetOptions, loanAssetOptions, tokenCategoryOptions }: MarketFiltersProps) {
  const {
    values: [chainValues, collateralAssetValues, loanAssetValues, categoryValues],
    addShallowSearchParams,
    removeShallowSearchParams,
  } = useShallowSearchParams({
    keys: [FilterKey.Chains, FilterKey.CollateralAssets, FilterKey.LoanAssets, FilterKey.TokenCategories],
  });

  const onSelect = useCallback(
    (key: string, currentValues: string[], value: string) => {
      const deselecting = currentValues.includes(value);
      addShallowSearchParams([
        { key, value: deselecting ? currentValues.filter((v) => v !== value) : [...currentValues, value] },
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
          onSelect={(value) => onSelect(FilterKey.Chains, chainValues ?? [], value)}
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
          onSelect={(value) => onSelect(FilterKey.CollateralAssets, collateralAssetValues ?? [], value)}
          onReset={() => removeShallowSearchParams([FilterKey.CollateralAssets])}
        />
      )}
      {loanAssetOptions.length > 1 && (
        <MultiSelect
          emptyValue={loanAssetValues === undefined || loanAssetValues.length === 0 ? "All Loan Assets" : "Loan Assets"}
          placeholder="Search for token"
          options={loanAssetOptions}
          value={loanAssetValues ?? []}
          onSelect={(value) => onSelect(FilterKey.LoanAssets, loanAssetValues ?? [], value)}
          onReset={() => removeShallowSearchParams([FilterKey.LoanAssets])}
        />
      )}
      {tokenCategoryOptions.length > 1 && (
        <MultiSelect
          emptyValue={categoryValues === undefined || categoryValues.length === 0 ? "All Categories" : "Categories"}
          options={tokenCategoryOptions}
          value={categoryValues ?? []}
          onSelect={(value) => onSelect(FilterKey.TokenCategories, categoryValues ?? [], value)}
          onReset={() => removeShallowSearchParams([FilterKey.TokenCategories])}
        />
      )}
      <ResetFiltersButton />
    </div>
  );
}
