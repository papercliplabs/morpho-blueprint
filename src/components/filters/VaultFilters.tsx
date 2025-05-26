"use client";
import { useCallback } from "react";

import { APP_CONFIG } from "@/config";
import { useShallowSearchParams } from "@/hooks/useShallowSearchParams";

import { MultiSelect, MultiSelectOption } from "../MultiSelect";

import { ResetFiltersButton } from "./ResetFiltersButton";
import { FilterKey } from "./types";

interface VaultFiltersProps {
  chainOptions: MultiSelectOption[];
  assetOptions: MultiSelectOption[];
  curatorOptions: MultiSelectOption[];
}

export function VaultFilters({ chainOptions, assetOptions, curatorOptions }: VaultFiltersProps) {
  const {
    values: [chainValues, assetValues, curatorValues],
    addShallowSearchParams,
    removeShallowSearchParams,
  } = useShallowSearchParams({
    keys: [FilterKey.Chains, FilterKey.SupplyAssets, FilterKey.Curators],
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
    <div className="flex gap-4 overflow-x-auto pb-0.5">
      {chainOptions.length > 1 && (
        <MultiSelect
          emptyValue={chainValues.length === 0 ? "All Chains" : "Chains"}
          options={chainOptions}
          value={chainValues}
          onSelect={(value) => onSelect(FilterKey.Chains, chainValues, value)}
          onReset={() => removeShallowSearchParams([FilterKey.Chains])}
        />
      )}
      {assetOptions.length > 1 && (
        <MultiSelect
          emptyValue={assetValues.length === 0 ? "All Assets" : "Assets"}
          placeholder="Search for token"
          options={assetOptions}
          value={assetValues}
          onSelect={(value) => onSelect(FilterKey.SupplyAssets, assetValues, value)}
          onReset={() => removeShallowSearchParams([FilterKey.SupplyAssets])}
        />
      )}
      {APP_CONFIG.featureFlags.curatorColumn && curatorOptions.length > 1 && (
        <MultiSelect
          emptyValue={curatorValues.length === 0 ? "All Curators" : "Curators"}
          options={curatorOptions}
          value={curatorValues}
          onSelect={(value) => onSelect(FilterKey.Curators, curatorValues, value)}
          onReset={() => removeShallowSearchParams([FilterKey.Curators])}
        />
      )}
      <ResetFiltersButton />
    </div>
  );
}
