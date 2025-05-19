"use client";

import { ChevronDown } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type MultiSelectOption = {
  value: string;
  component: React.ReactNode;
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="!body-medium max-w-[200px] flex-1">
          <span className="flex flex-1 gap-1">
            {emptyValue}
            {value.length > 0 && <span>({value.length})</span>}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} className="body-large" />
          <CommandList>
            <CommandEmpty>{noResultsText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
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
      </PopoverContent>
    </Popover>
  );
}
