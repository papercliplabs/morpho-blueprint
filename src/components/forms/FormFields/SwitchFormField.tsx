"use client";
import type { ComponentProps, ReactNode } from "react";
import type { FieldPath, FieldValues } from "react-hook-form";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface SwitchFormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues extends FieldValues | undefined = undefined,
> extends Omit<ComponentProps<typeof FormField<TFieldValues, TName, TTransformedValues>>, "render"> {
  labelContent: ReactNode;
  switchLabel?: ReactNode;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function SwitchFormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues extends FieldValues | undefined = undefined,
>({ labelContent, switchLabel, ...props }: SwitchFormFieldProps<TFieldValues, TName, TTransformedValues>) {
  return (
    <FormField
      {...props}
      render={({ field: { value, onChange } }) => (
        <FormItem className="flex w-full items-center justify-between gap-2">
          {/* Don't use form label here becuase it will associate a click with the switch */}
          <div className="label-sm text-content-secondary">
            <span>{labelContent}</span>
          </div>

          <div className="label-sm flex items-center gap-2">
            {switchLabel}
            <FormControl>
              <Switch checked={value} onCheckedChange={onChange} />
            </FormControl>
          </div>
        </FormItem>
      )}
    />
  );
}
