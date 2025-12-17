"use client";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

interface UseShallowSearchParamParams {
  keys: string[];
}

interface UseShallowSearchParamReturnType {
  values: string[][]; // Array of values for each key in keys
  addShallowSearchParams: (params: { key: string; value: string | string[] }[]) => void;
  removeShallowSearchParams: (keys: string[]) => void;
}

export function useShallowSearchParams({ keys }: UseShallowSearchParamParams): UseShallowSearchParamReturnType {
  const searchParams = useSearchParams();
  const values = useMemo(() => {
    return keys.map((key) => searchParams.getAll(key));
  }, [searchParams, keys]);

  const addShallowSearchParams = useCallback(
    (params: { key: string; value: string | string[] }[]) => {
      const newParams = new URLSearchParams(searchParams.toString());

      for (const { key, value } of params) {
        if (Array.isArray(value)) {
          newParams.delete(key); // Delete all old
          for (const v of value) {
            newParams.append(key, v);
          }
        } else {
          newParams.set(key, value);
        }
      }

      window.history.pushState(null, "", `?${newParams.toString()}`);
    },
    [searchParams],
  );

  const removeShallowSearchParams = useCallback(
    (keys: string[]) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const key of keys) {
        params.delete(key);
      }

      window.history.pushState(null, "", `?${params.toString()}`);
    },
    [searchParams],
  );

  return { values, addShallowSearchParams, removeShallowSearchParams };
}
