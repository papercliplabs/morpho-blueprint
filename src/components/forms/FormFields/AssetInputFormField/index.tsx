"use client";

import clsx from "clsx";

import { TokenIcon } from "@/components/TokenIcon";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import NumberFlow from "@/components/ui/number-flow";
import type { ChainInfo, TokenInfo } from "@/data/whisk/fragments";
import { numberToString } from "@/utils/format";

// biome-ignore lint/suspicious/noExplicitAny: Allow any for the FormField component
interface AssetInputFormFieldProps<TFieldValues extends Record<string, any>>
  extends Omit<React.ComponentProps<typeof FormField<TFieldValues>>, "render"> {
  header: string;
  chain: ChainInfo;
  asset: TokenInfo & { priceUsd: number | null };
  setIsMax?: (isMax: boolean) => void;
  maxValue?: number;
}

// biome-ignore lint/suspicious/noExplicitAny: Allow any for the FormField component
function AssetInputFormField<TFieldValues extends Record<string, any>>({
  chain,
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
        <FormItem className="group flex flex-col rounded-md border-2 border-transparent bg-muted p-4 transition has-focus:border-primary">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FormLabel className="body-small-plus max-w-40 truncate">{header}</FormLabel>
            <FormMessage />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex min-w-0 items-center justify-between gap-4">
              <FormControl>
                <Input
                  autoComplete="off"
                  className={clsx(
                    "!heading-2 h-12 rounded-none border-none bg-transparent p-0 shadow-none focus:ring-0 focus:ring-offset-0",
                    fieldState.error && !!field.value && "text-destructive",
                  )}
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
                <div className="flex items-center gap-2 px-2">
                  <TokenIcon token={asset} chain={chain} size="sm" chainClassName="border-muted" />
                  <span className="body-large-plus max-w-20 truncate">{asset.symbol}</span>
                </div>
              )}
            </div>
            <div className="body-small flex h-[24px] items-center justify-between text-muted-foreground">
              {asset.priceUsd != null && (
                <NumberFlow
                  value={(Number.isNaN(field.value) ? 0 : field.value) * asset.priceUsd}
                  format={{ currency: "USD" }}
                />
              )}
              {maxValue !== undefined && (
                <div className="flex h-[24px] items-center gap-1">
                  <span>Available: </span>
                  <div className="relative">
                    <NumberFlow value={maxValue ?? 0} />
                  </div>
                  <Button
                    variant="secondary"
                    size="xs"
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
                </div>
              )}
            </div>
          </div>
        </FormItem>
      )}
    />
  );
}

export { AssetInputFormField };
