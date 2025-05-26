"use client";
import { useTheme } from "next-themes";
import "./snippet.ts";

type PoweredByMorphoProps = {
  placement?: "left" | "right" | "center";
} & React.ComponentProps<"div">;

function PoweredByMorpho({ className, placement }: PoweredByMorphoProps) {
  const { resolvedTheme } = useTheme();
  return (
    <div className={className}>
      {/* @ts-expect-error Property 'powered-by-morpho' does not exist on type 'JSX.IntrinsicElements' */}
      <powered-by-morpho theme={resolvedTheme} placement={placement}></powered-by-morpho>
    </div>
  );
}

export { PoweredByMorpho };
