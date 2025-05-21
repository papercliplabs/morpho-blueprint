"use client";
import { useCallback } from "react";

import { useShallowSearchParams } from "@/hooks/useShallowSearchParams";

import { MultiSelect, MultiSelectOption } from "../MultiSelect";

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
    (key: string, currentValues: string[], value: string) => {
      const deselecting = currentValues.includes(value);
      addShallowSearchParams([
        { key, value: deselecting ? currentValues.filter((v) => v !== value) : [...currentValues, value] },
      ]);
    },
    [addShallowSearchParams]
  );

  return (
    <div className="flex gap-4 overflow-x-auto">
      {chainOptions.length > 1 && (
        <MultiSelect
          emptyValue={chainValues.length === 0 ? "All Chains" : "Chains"}
          options={chainOptions}
          value={chainValues}
          onSelect={(value) => onSelect(FilterKey.Chains, chainValues, value)}
          onReset={() => removeShallowSearchParams([FilterKey.Chains])}
        />
      )}
      {collateralAssetOptions.length > 1 && (
        <MultiSelect
          emptyValue={collateralAssetValues.length === 0 ? "All Collateral Assets" : "Collateral Assets"}
          placeholder="Search for token"
          options={collateralAssetOptions}
          value={collateralAssetValues}
          onSelect={(value) => onSelect(FilterKey.CollateralAssets, collateralAssetValues, value)}
          onReset={() => removeShallowSearchParams([FilterKey.CollateralAssets])}
        />
      )}
      {loanAssetOptions.length > 1 && (
        <MultiSelect
          emptyValue={loanAssetValues.length === 0 ? "All Loan Assets" : "Loan Assets"}
          placeholder="Search for token"
          options={loanAssetOptions}
          value={loanAssetValues}
          onSelect={(value) => onSelect(FilterKey.LoanAssets, loanAssetValues, value)}
          onReset={() => removeShallowSearchParams([FilterKey.LoanAssets])}
        />
      )}
      <ResetFiltersButton />
    </div>
  );
}
