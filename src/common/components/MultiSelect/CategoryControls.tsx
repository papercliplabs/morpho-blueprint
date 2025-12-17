"use client";

import { useCallback, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

type CategoryOptionLike = {
  value: string;
  category?: string | null;
};

type CategoryControlsProps<TOption extends CategoryOptionLike> = {
  options: TOption[];
  value: string[];
  onSelect: (values: string[]) => void;
  onSortedOptionsChange: (sorted: TOption[]) => void;
};

export function CategoryControls<TOption extends CategoryOptionLike>({
  options,
  value,
  onSelect,
  onSortedOptionsChange,
}: CategoryControlsProps<TOption>) {
  // name -> values
  const categoryMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const option of options) {
      const category = option.category;

      if (category == null) {
        continue;
      }

      const set = map.get(category) ?? new Set<string>();
      set.add(option.value);

      map.set(category, set);
    }
    return map;
  }, [options]);

  // Derive active category based on values
  const activeCategory = useMemo(() => {
    if (value.length === 0) return null;

    const selectedSet = new Set(value);
    let candidateCategory: string | null = null;

    // First, ensure all selected items are from the same category
    for (const val of value) {
      const option = options.find((o) => o.value === val);
      const category = option?.category ?? null;

      if (candidateCategory === null) {
        candidateCategory = category;
      } else if (candidateCategory !== category) {
        return null; // Mixed categories - no match
      }
    }

    // If we have a candidate category, check if it's a complete match
    if (candidateCategory) {
      const categorySet = categoryMap.get(candidateCategory);
      if (
        categorySet &&
        selectedSet.size === categorySet.size &&
        [...selectedSet].every((val) => categorySet.has(val))
      ) {
        return candidateCategory;
      }
    }

    return null; // Not a complete category match
  }, [value, options, categoryMap]);

  const handleCategoryChange = useCallback(
    (category: string | null) => {
      if (category === null) return;

      const optAndMatch = options.map((o) => ({
        opt: o,
        match: String(o.category ?? "") === category,
      }));

      // Sort
      const sortedOptsAndMatch = [...optAndMatch].sort((a, b) => {
        const aMatch = a.match ? 1 : 0;
        const bMatch = b.match ? 1 : 0;
        if (aMatch !== bMatch) return bMatch - aMatch;

        const aSelected = value.includes(a.opt.value) ? 1 : 0;
        const bSelected = value.includes(b.opt.value) ? 1 : 0;
        if (aSelected !== bSelected) return bSelected - aSelected;

        return 0;
      });

      // Set selections
      const changes = sortedOptsAndMatch.filter((o) => o.match !== value.includes(o.opt.value));
      onSelect(changes.map((o) => o.opt.value));

      // Set sorting
      const sortedOpts = sortedOptsAndMatch.map((o) => o.opt);
      onSortedOptionsChange(sortedOpts);
    },
    [options, value, onSelect, onSortedOptionsChange],
  );

  if (categoryMap.size === 0) return null;

  return (
    <div className="flex w-full gap-2 overflow-x-auto px-4 pt-3 pb-2">
      <Tabs variant="default" value={activeCategory ?? ""} onValueChange={handleCategoryChange} className="grow">
        <TabsList className="h-5 flex-1">
          {Array.from(categoryMap.keys()).map((category) => (
            <TabsTrigger value={category} key={category}>
              {category === "Stable" ? "Stable" : category.toUpperCase()}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
