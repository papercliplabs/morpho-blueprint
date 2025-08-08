"use client";

import { ChevronDown } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

import { PopoverDrawer, PopoverDrawerContent, PopoverDrawerTrigger } from "../ui/popover-drawer";

export type MultiSelectOption = {
  value: string;
  component: React.ReactNode;
  category?: string | null;
};

type MultiSelectProps = {
  placeholder?: string;
  defaultOpen?: boolean;
  emptyValue?: string | null;
  noResultsText?: string;
  value: string[];
  options: MultiSelectOption[];
  onSelect: (value: string) => void;
  onReset: () => void;
};

export function MultiSelect({
  emptyValue = null,
  defaultOpen = false,
  placeholder = "Search",
  noResultsText = "No results found.",
  value,
  onReset,
  onSelect,
  options,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    for (const option of options) {
      if (option.category) {
        set.add(String(option.category));
      }
    }
    return Array.from(set);
  }, [options]);

  const filteredOptions = React.useMemo(() => {
    if (!activeCategory) return options;
    return options.filter((o) => String(o.category ?? "") === activeCategory);
  }, [options, activeCategory]);

  return (
    <PopoverDrawer open={open} onOpenChange={setOpen}>
      <PopoverDrawerTrigger asChild>
        <Button variant="outline" aria-expanded={open} className="!body-medium max-w-[200px] flex-1 shadow-sm">
          <span className="flex flex-1 gap-1">
            {emptyValue}
            {value.length > 0 && <span>({value.length})</span>}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
        </Button>
      </PopoverDrawerTrigger>
      <PopoverDrawerContent className="w-full p-0 lg:w-[200px]" align="start">
        <Command>
          <CommandInput placeholder={placeholder} className="body-large" />
          <CategoryPills
            categories={categories}
            activeCategory={activeCategory}
            onChange={setActiveCategory}
          />
          <CommandList>
            <CommandEmpty>{noResultsText}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => onSelect(currentValue)}
                >
                  <Checkbox checked={value.includes(option.value)} />
                  {option.component}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <div className="flex items-center gap-3 p-4">
            <Button className="flex-1" onClick={onReset} variant="secondary">
              Reset
            </Button>
            <Button className="flex-1" onClick={() => setOpen(false)}>
              Apply
            </Button>
          </div>
        </Command>
      </PopoverDrawerContent>
    </PopoverDrawer>
  );
}

type CategoryPillsProps = {
  categories: string[];
  activeCategory: string | null;
  onChange: (category: string | null) => void;
};

function CategoryPills({ categories, activeCategory, onChange }: CategoryPillsProps) {
  if (categories.length === 0) return null;
  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-2 pt-3">
      <button
        className={`rounded-md px-3 py-1 text-sm ${
          activeCategory === null ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
        }`}
        onClick={() => onChange(null)}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          className={`rounded-md px-3 py-1 text-sm ${
            activeCategory === category ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
          }`}
          onClick={() => onChange(category)}
        >
          {category === "Stable" ? "Stable" : category.toUpperCase()}
        </button>
      ))}
    </div>
  );
}