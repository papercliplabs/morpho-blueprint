/// <reference types="react" />

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "powered-by-morpho": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          theme: "dark" | "light";
          placement: "center" | "left" | "right";
        },
        HTMLElement
      >;
    }
  }
}
