"use client";

import clsx from "clsx";

import { Avatar, AvatarProps } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { numberToString } from "@/utils/format";

import NumberFlow from "../../ui/NumberFlow";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface AssetInputFormFieldProps<TFieldValues extends Record<string, any>>
  extends Omit<React.ComponentProps<typeof FormField<TFieldValues>>, "render"> {
  header: string;
  asset: {
    symbol: string;
    priceUsd: number;
    avatar: AvatarProps;
  };
  setIsMax?: (isMax: boolean) => void;
  maxValue?: number;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function AssetInputFormField<TFieldValues extends Record<string, any>>({
  asset,
  header,
  maxValue,
  setIsMax,
  ...props
}: AssetInputFormFieldProps<TFieldValues>) {
  return (
    <FormField
      {...props}
      render={({ field, fieldState }) => (
        <FormItem className="bg-muted group has-focus:border-primary flex flex-col gap-2 rounded-md border-2 border-transparent p-4 transition">
          <div className="text-muted-foreground flex items-center gap-2">
            <FormLabel className="body-small-plus">{header}</FormLabel>
            <FormMessage />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex min-w-0 items-center justify-between gap-4">
              <FormControl>
                <Input
                  className={clsx("heading-3", fieldState.error && !!field.value && "text-destructive")}
                  placeholder="0"
                  inputMode="decimal"
                  type="text"
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^0*(\d+)?(\.\d*)?$/.test(value)) {
                      field.onChange(value);
                      setIsMax?.(false);
                    }
                  }}
                  value={field.value ?? ""}
                  {...props}
                />
              </FormControl>
              {!!asset && (
                <div className="flex items-center gap-1 px-2">
                  <Avatar {...asset.avatar} size="xs" />
                  <span className="body-medium-plus">{asset.symbol}</span>
                </div>
              )}
            </div>
            <div className="text-muted-foreground body-small flex items-center justify-between">
              {!!asset.priceUsd && (
                <NumberFlow value={(field.value ?? 0) * asset.priceUsd} format={{ currency: "USD" }} />
              )}
              <div className="flex items-center gap-1">
                <NumberFlow value={maxValue ?? 0} />
                {maxValue != undefined && (
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    disabled={field.disabled}
                    onClick={() => {
                      if (!field.disabled) {
                        field.onChange(numberToString(maxValue));
                        setIsMax?.(true);
                      }
                    }}
                  >
                    Max
                  </Button>
                )}
              </div>
            </div>
          </div>
        </FormItem>
      )}
    />
  );
}

export { AssetInputFormField };
