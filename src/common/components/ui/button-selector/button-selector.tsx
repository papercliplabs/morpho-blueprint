"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { cn } from "@/common/utils/shadcn";

export interface ButtonSelectorProps<T = string> {
  options: T[];
  selected: T;
  setSelected: (option: T) => void;
  className?: string;
  getLabel?: (option: T) => string;
}

export function ButtonSelector<T = string>(props: ButtonSelectorProps<T>) {
  const { options, selected, setSelected, className, getLabel = (option) => String(option) } = props;
  const id = useId();

  return (
    <div className={cn("flex gap-px", className)}>
      {options.map((option) => (
        <button
          key={String(option)}
          type="button"
          onClick={() => setSelected(option)}
          className={cn(
            "body-medium-plus relative cursor-pointer rounded-full px-4 py-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-primary",
            {
              "text-foreground": selected === option,
              "text-muted-foreground": selected !== option,
            },
          )}
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          {selected === option && (
            <motion.span
              layoutId={id}
              className="absolute inset-0 rounded-full bg-accent"
              transition={{ type: "spring", bounce: 0.15, duration: 0.55 }}
            />
          )}
          <span className="relative z-10">{getLabel(option)}</span>
        </button>
      ))}
    </div>
  );
}
