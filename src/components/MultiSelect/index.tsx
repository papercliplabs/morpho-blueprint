"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

import { PopoverDrawer, PopoverDrawerContent, PopoverDrawerTrigger } from "../ui/popover-drawer";
import { CategoryControls } from "./CategoryControls";

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
  onSelect: (values: string[]) => void;
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
  const [open, setOpen] = useState(defaultOpen);
  const [sortedOptions, setSortedOptions] = useState(options);
  useEffect(() => {
    setSortedOptions(options);
  }, [options]);

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
      <PopoverDrawerContent className="w-full p-0 lg:w-[300px]" align="start">
        <Command>
          <CommandInput placeholder={placeholder} className="body-large" />
          <CategoryControls
            options={options}
            value={value}
            onSelect={onSelect}
            onSortedOptionsChange={setSortedOptions}
          />
          <CommandList>
            <CommandEmpty>{noResultsText}</CommandEmpty>
            <CommandGroup>
              {sortedOptions.map((option: MultiSelectOption) => (
                <CommandItem key={option.value} value={option.value} onSelect={(val) => onSelect([val])}>
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
