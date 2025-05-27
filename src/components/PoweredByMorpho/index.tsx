"use client";
import { useTheme } from "next-themes";
import "./snippet.ts";
import { useEffect, useRef } from "react";

type PoweredByMorphoProps = {
  placement?: "center" | "bottom-left" | "bottom-right" | "top-left" | "top-right";
} & React.ComponentProps<"div">;

function PoweredByMorpho({ className, placement }: PoweredByMorphoProps) {
  const ref = useRef<HTMLElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (resolvedTheme) {
      ref.current?.setAttribute("theme", resolvedTheme);
    }
  }, [resolvedTheme]);

  useEffect(() => {
    if (placement) {
      ref.current?.setAttribute("placement", placement);
    }
  }, [placement]);

  return (
    <div className={className}>
      {/* @ts-expect-error Property 'powered-by-morpho' does not exist on type 'JSX.IntrinsicElements' */}
      <powered-by-morpho ref={ref}></powered-by-morpho>
    </div>
  );
}

export { PoweredByMorpho };
