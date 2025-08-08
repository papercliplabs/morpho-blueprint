"use client";
import { useCallback } from "react";

import { APP_CONFIG } from "@/config";
import { useShallowSearchParams } from "@/hooks/useShallowSearchParams";

import { MultiSelect, type MultiSelectOption } from "../MultiSelect";

import { ResetFiltersButton } from "./ResetFiltersButton";
import { FilterKey } from "./types";

interface VaultFiltersProps {
  chainOptions: MultiSelectOption[];
  assetOptions: MultiSelectOption[];
  curatorOptions: MultiSelectOption[];
  tokenCategoryOptions: MultiSelectOption[];
}

export function VaultFilters({ chainOptions, assetOptions, curatorOptions, tokenCategoryOptions }: VaultFiltersProps) {
  const {
    values: [chainValues, assetValues, curatorValues, categoryValues],
    addShallowSearchParams,
    removeShallowSearchParams,
  } = useShallowSearchParams({
    keys: [FilterKey.Chains, FilterKey.SupplyAssets, FilterKey.Curators, FilterKey.TokenCategories],
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
      {assetOptions.length > 1 && (
        <MultiSelect
          emptyValue={assetValues === undefined || assetValues.length === 0 ? "All Assets" : "Assets"}
          placeholder="Search for token"
          options={assetOptions}
          value={assetValues ?? []}
          onSelect={(value) => onSelect(FilterKey.SupplyAssets, assetValues ?? [], value)}
          onReset={() => removeShallowSearchParams([FilterKey.SupplyAssets])}
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
      {!APP_CONFIG.featureFlags.hideCurator && curatorOptions.length > 1 && (
        <MultiSelect
          emptyValue={curatorValues === undefined || curatorValues.length === 0 ? "All Curators" : "Curators"}
          options={curatorOptions}
          value={curatorValues ?? []}
          onSelect={(value) => onSelect(FilterKey.Curators, curatorValues ?? [], value)}
          onReset={() => removeShallowSearchParams([FilterKey.Curators])}
        />
      )}
      <ResetFiltersButton />
    </div>
  );
}
