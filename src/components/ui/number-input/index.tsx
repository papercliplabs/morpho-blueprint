import type * as React from "react";

import { Input } from "@/components/ui/input";

function NumberInput({
  maximumFractionDigits = 18,
  onChange,
  ...props
}: React.ComponentProps<"input"> & { maximumFractionDigits?: number }) {
  return (
    <Input
      autoComplete="off"
      placeholder="0.00"
      inputMode="decimal"
      data-slot="number-input"
      type="text"
      onChange={(e) => {
        const value = e.target.value;

        // Validate numeric input and limit decimal places to maximumFractionDigits
        if (new RegExp(`^0*(\\d+)?(\\.\\d{0,${maximumFractionDigits}})?$`).test(value)) {
          e.target.value = value === "." ? "0." : value; // Override the value if "." to "0." to always be a valid number.
          onChange?.(e);
        }
      }}
      {...props}
    />
  );
}

export { Input, NumberInput };
