"use client";
import { useCallback } from "react";

import { useShallowSearchParams } from "@/hooks/useShallowSearchParams";

import { MultiSelect, MultiSelectOption } from "../MultiSelect";

import { FilterKey } from "./types";

interface VaultFiltersProps {
  chainOptions: MultiSelectOption[];
  assetOptions: MultiSelectOption[];
  curatorOptions: MultiSelectOption[];
}

export function VaultFilters({ chainOptions, assetOptions, curatorOptions }: VaultFiltersProps) {
  return <VaultFiltersLayout chainOptions={chainOptions} assetOptions={assetOptions} curatorOptions={curatorOptions} />;
}

interface VaultFiltersLayoutProps {
  chainOptions: MultiSelectOption[];
  assetOptions: MultiSelectOption[];
  curatorOptions: MultiSelectOption[];
}

function VaultFiltersLayout({ chainOptions, assetOptions, curatorOptions }: VaultFiltersLayoutProps) {
  const {
    values: [chainValues, assetValues, curatorValues],
    addShallowSearchParams,
    removeShallowSearchParams,
  } = useShallowSearchParams({
    keys: [FilterKey.Chains, FilterKey.Assets, FilterKey.Curators],
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
    <div className="flex gap-4">
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
          options={assetOptions}
          value={assetValues}
          onSelect={(value) => onSelect(FilterKey.Assets, assetValues, value)}
          onReset={() => removeShallowSearchParams([FilterKey.Assets])}
        />
      )}
      {curatorOptions.length > 1 && (
        <MultiSelect
          emptyValue={curatorValues.length === 0 ? "All Curators" : "Curators"}
          options={curatorOptions}
          value={curatorValues}
          onSelect={(value) => onSelect(FilterKey.Curators, curatorValues, value)}
          onReset={() => removeShallowSearchParams([FilterKey.Curators])}
        />
      )}
    </div>
  );
}
