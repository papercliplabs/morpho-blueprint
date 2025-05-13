"use client";

import { ComponentProps, ReactNode, useMemo } from "react";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { formatNumber } from "@/utils/format";

/* eslint-disable @typescript-eslint/no-explicit-any */
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

/* eslint-disable @typescript-eslint/no-explicit-any */
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
          `${formatNumber(step + step * stepNumber, { minimumFractionDigits: 0, maximumFractionDigits: 1 })}${unit}`
      )
      .concat(["Max"]);
  }, [sliderMin, sliderMax, unit]);

  return (
    <FormField
      {...props}
      render={({ field: { value, onChange } }) => (
        <FormItem className="bg-muted flex w-full flex-col gap-4 rounded-md p-4">
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
                    <div className="body-medium text-muted-foreground absolute top-0 right-0 flex size-8 items-center justify-center">
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
            <div className="text-content-secondary label-sm flex items-center justify-between">
              {ticks.map((tick, i) => (
                <span key={i}>{tick}</span>
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
