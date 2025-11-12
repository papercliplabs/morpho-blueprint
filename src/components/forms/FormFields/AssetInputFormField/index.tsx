"use client";

import clsx from "clsx";
import type { FieldPath, FieldValues } from "react-hook-form";
import { formatUnits } from "viem";
import { TokenIcon } from "@/components/TokenIcon";
import { Button } from "@/components/ui/button";
import { DecimalInput } from "@/components/ui/decimal-input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import NumberFlow from "@/components/ui/number-flow";
import type { ChainInfo, TokenInfo } from "@/data/whisk/fragments";
import { descaleBigIntToNumber } from "@/utils/format";

interface AssetInputFormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues extends FieldValues | undefined = undefined,
> extends Omit<React.ComponentProps<typeof FormField<TFieldValues, TName, TTransformedValues>>, "render"> {
  header: string;
  chain: ChainInfo;
  asset: TokenInfo & { priceUsd: number | null };
  setIsMax?: (isMax: boolean) => void;
  maxValue?: bigint;
}

function AssetInputFormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues extends FieldValues | undefined = undefined,
>({
  chain,
  asset,
  header,
  maxValue,
  setIsMax,
  ...props
}: AssetInputFormFieldProps<TFieldValues, TName, TTransformedValues>) {
  return (
    <FormField
      {...props}
      render={({ field, fieldState }) => (
        <FormItem className="group flex flex-col rounded-md border-2 border-transparent bg-muted p-4 transition has-focus:border-primary">
          <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
            <FormLabel className="body-small-plus truncate">{header}</FormLabel>
            <FormMessage className="shrink-0" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex min-w-0 items-center justify-between gap-4">
              <FormControl>
                <DecimalInput
                  autoComplete="off"
                  className={clsx(
                    "!heading-2 h-12 rounded-none border-none bg-transparent p-0 shadow-none focus:ring-0 focus:ring-offset-0",
                    fieldState.error && !!field.value && fieldState.isDirty
                      ? "text-destructive-foreground"
                      : "placeholder:text-muted-foreground/80",
                  )}
                  decimals={asset.decimals}
                  {...field}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    setIsMax?.(false);
                  }}
                  {...props}
                />
              </FormControl>
              {!!asset && (
                <div className="flex max-w-1/2 items-center gap-2 px-2">
                  <TokenIcon token={asset} chain={chain} size="sm" chainClassName="border-muted" />
                  <span className="body-large-plus truncate">{asset.symbol}</span>
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
                    <NumberFlow value={descaleBigIntToNumber(maxValue, asset.decimals)} />
                  </div>
                  <Button
                    variant="secondary"
                    size="xs"
                    type="button"
                    disabled={maxValue === 0n || field.disabled}
                    onClick={() => {
                      if (!field.disabled) {
                        field.onChange(formatUnits(maxValue, asset.decimals));
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
