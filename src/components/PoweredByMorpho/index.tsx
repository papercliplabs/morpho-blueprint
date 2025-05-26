import { useTheme } from "next-themes";
import "./snippet.ts";

type PoweredByMorphoProps = {
  placement?: "left" | "right" | "center";
};

function PoweredByMorpho({ placement }: PoweredByMorphoProps) {
  const { resolvedTheme } = useTheme();
  return (
    <>
      {/* @ts-expect-error Property 'powered-by-morpho' does not exist on type 'JSX.IntrinsicElements' */}
      <powered-by-morpho theme={resolvedTheme} placement={placement}></powered-by-morpho>
    </>
  );
}

export { PoweredByMorpho };
