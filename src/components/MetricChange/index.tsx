"use client";

import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/utils/shadcn";

interface MetricChangeProps extends React.ComponentProps<"div"> {
  name: string;
  initialValue: ReactNode;
  finalValue?: ReactNode;
}

export function MetricChange({ name, initialValue, finalValue, className, ...props }: MetricChangeProps) {
  return (
    <div className={cn("flex items-center justify-between overflow-hidden text-muted", className)} {...props}>
      <span className="body-medium text-muted-foreground">{name}</span>
      <MetricChangeValues initialValue={initialValue} finalValue={finalValue} />
    </div>
  );
}

export function MetricChangeValues({ initialValue, finalValue }: { initialValue: ReactNode; finalValue?: ReactNode }) {
  return (
    <MotionConfig transition={{ duration: 0.3, type: "spring", bounce: 0 }}>
      <motion.div
        layout
        className="body-medium-plus relative flex items-center gap-1 overflow-hidden text-card-foreground"
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            layout
            key="initial"
            className={clsx("transition-colors", !finalValue && "text-card-foreground")}
          >
            {initialValue}
          </motion.span>

          {!!finalValue && (
            <motion.div
              key="final"
              className="flex items-center gap-1"
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%" }}
            >
              <motion.span layout className="text-foreground" key="arrow">
                <ArrowRight className="size-[14px] shrink-0" />
              </motion.span>
              <motion.div layout className="flex items-center gap-1 text-foreground">
                {finalValue}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </MotionConfig>
  );
}
