"use client";

import { type ComponentProps, type ReactNode, useMemo } from "react";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { formatNumber } from "@/utils/format";

// biome-ignore lint/suspicious/noExplicitAny: Allow any for the FormField component
interface SliderInputFormFieldProps<TFieldValues extends Record<string, any>>
  extends Omit<ComponentProps<typeof FormField<TFieldValues>>, "render"> {
  includeInput?: boolean;
  labelContent: ReactNode;
  sliderMin: number;
  sliderMax: number;
  sliderStep: number;
  showTicks?: boolean;
  unit: string;
}

// biome-ignore lint/suspicious/noExplicitAny: Allow any for the FormField component
function SliderInputFormField<TFieldValues extends Record<string, any>>({
  labelContent,
  includeInput = true,
  sliderMin,
  sliderMax,
  sliderStep,
  showTicks = true,
  unit,
  ...props
}: SliderInputFormFieldProps<TFieldValues>) {
  const ticks = useMemo(() => {
    const numberOfTicks = 5;
    const step = (sliderMax - sliderMin) / numberOfTicks;

    return [...Array(numberOfTicks)]
      .fill(0)
      .map(
        (_, stepNumber) =>
          `${formatNumber(step + step * stepNumber, { minimumFractionDigits: 0, maximumFractionDigits: 1 })}${unit}`,
      )
      .concat(["Max"]);
  }, [sliderMin, sliderMax, unit]);

  return (
    <FormField
      {...props}
      render={({ field: { value, onChange } }) => (
        <FormItem className="flex w-full flex-col gap-4 rounded-md bg-muted p-4">
          <div className="flex w-full items-center justify-between gap-2">
            <FormLabel>{labelContent}</FormLabel>
            {includeInput && (
              <FormControl>
                <div className="relative">
                  <Input
                    placeholder="0"
                    inputMode="decimal"
                    type="text"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^0*(\d+)?(\.\d*)?$/.test(value)) {
                        onChange(value);
                      }
                    }}
                    value={value ?? ""}
                    className="max-w-[76px] pr-9"
                    variantSize="sm"
                    {...props}
                  />
                  {unit && (
                    <div className="body-medium absolute top-0 right-0 flex size-8 items-center justify-center text-muted-foreground">
                      {unit}
                    </div>
                  )}
                </div>
              </FormControl>
            )}
          </div>

          <FormControl>
            <Slider min={sliderMin} max={sliderMax} step={sliderStep} value={[value]} onValueChange={onChange} />
          </FormControl>

          {showTicks && (
            <div className="label-sm flex items-center justify-between text-content-secondary">
              {ticks.map((tick) => (
                <span key={tick}>{tick}</span>
              ))}
            </div>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export { SliderInputFormField };
