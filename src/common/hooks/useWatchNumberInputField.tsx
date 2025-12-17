import { useMemo } from "react";
import { type Control, type FieldPath, type FieldValues, useWatch } from "react-hook-form";

export function useWatchNumberInputField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(control: Control<TFieldValues>, name: TName): number {
  // React hook form incorrectly types this (based on zodResolver output instead of input)
  const rawValue = useWatch({ control, name }) as unknown as string | undefined | null;

  const numericValue = useMemo(() => {
    if (rawValue === undefined || rawValue === null || rawValue === "" || rawValue === ".") {
      return 0;
    }

    const num = Number(rawValue);
    if (Number.isNaN(num)) {
      throw new Error("Invalid number");
    }

    return num;
  }, [rawValue]);

  return numericValue;
}
