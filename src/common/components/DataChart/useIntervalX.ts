"use client";

import { useEffect, useState } from "react";
import { useResponsiveContext } from "@/common/providers/ResponsiveProvider";

export function useIntervalX(dataLength: number) {
  const { isDesktop } = useResponsiveContext();
  const [interval, setInterval] = useState<number>(30);

  useEffect(() => {
    setInterval(Math.ceil(dataLength / (isDesktop ? 6.5 : 3)));
  }, [dataLength, isDesktop]);

  return { intervalX: interval };
}
