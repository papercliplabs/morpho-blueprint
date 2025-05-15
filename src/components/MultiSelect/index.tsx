"use client";

import { ChevronDown } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Option = {
  value: string;
  component: React.ReactNode;
};

type MultiSelectProps = {
  placeholder?: string;
  defaultOpen?: boolean;
  emptyValue?: string | null;
  noResultsText?: string;
  value: string[];
  options: Option[];
  onSelect: (value: string) => void;
};

function MultiSelect({
  emptyValue = null,
  defaultOpen = false,
  placeholder = "Search",
  noResultsText = "No results found.",
  value,
  onSelect,
  options,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(defaultOpen);

  const selectedOptions = options.filter((option) => value.includes(option.value));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="!body-medium w-[200px] justify-between"
        >
          {value.length > 0 ? (
            value.length === 1 ? (
              selectedOptions[0].component
            ) : (
              <span>{selectedOptions.length} selected</span>
            )
          ) : (
            emptyValue
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
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
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { MultiSelect };
