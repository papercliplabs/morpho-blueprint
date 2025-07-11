"use client";
import { type ComponentProps, useMemo } from "react";

import { useShallowSearchParams } from "@/hooks/useShallowSearchParams";

import { Button } from "../ui/button";

import { ALL_FILTER_KEYS } from "./types";

export function ResetFiltersButton({ variant = "link", children, ...props }: ComponentProps<typeof Button>) {
  const { values, removeShallowSearchParams } = useShallowSearchParams({ keys: ALL_FILTER_KEYS });

  const anyFilters = useMemo(() => {
    return Object.values(values).some((value) => value.length > 0);
  }, [values]);

  return (
    <>
      {anyFilters && (
        <Button onClick={() => removeShallowSearchParams(ALL_FILTER_KEYS)} variant={variant} {...props}>
          {children ?? "Reset filters"}
        </Button>
      )}
    </>
  );
}
