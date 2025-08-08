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
  tagOptions?: MultiSelectOption[];
}

export function VaultFilters({ chainOptions, assetOptions, curatorOptions, tagOptions = [] }: VaultFiltersProps) {
  const {
    values: [chainValues, assetValues, curatorValues, tagValues],
    addShallowSearchParams,
    removeShallowSearchParams,
  } = useShallowSearchParams({
    keys: [FilterKey.Chains, FilterKey.SupplyAssets, FilterKey.Curators, FilterKey.VaultTags],
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
      {tagOptions.length > 0 && (
        <MultiSelect
          emptyValue={tagValues === undefined || tagValues.length === 0 ? "Type" : "Type"}
          options={tagOptions}
          value={tagValues ?? []}
          onSelect={(value) => onSelect(FilterKey.VaultTags, tagValues ?? [], value)}
          onReset={() => removeShallowSearchParams([FilterKey.VaultTags])}
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
