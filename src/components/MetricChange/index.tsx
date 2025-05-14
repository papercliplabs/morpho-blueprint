"use client";

import clsx from "clsx";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { ReactNode } from "react";

import { cn } from "@/utils/shadcn";

interface MetricChangeProps extends React.ComponentProps<"div"> {
  name: string;
  initialValue: ReactNode;
  finalValue?: ReactNode;
}

export function MetricChange({ name, initialValue, finalValue, className, ...props }: MetricChangeProps) {
  return (
    <div className={cn("flex items-center justify-between overflow-hidden", className)} {...props}>
      <span className="body-medium text-secondary-foreground">{name}</span>
      <MetricChangeValues initialValue={initialValue} finalValue={finalValue} />
    </div>
  );
}

export function MetricChangeValues({ initialValue, finalValue }: { initialValue: ReactNode; finalValue?: ReactNode }) {
  return (
    <div className="body-medium-plus text-muted-foreground relative flex items-center gap-1">
      <MotionConfig transition={{ duration: 0.3, type: "spring", bounce: 0 }}>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span layout key="initial" className={clsx("transition-colors", !finalValue && "text-foreground")}>
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
                →
              </motion.span>
              <motion.div layout className="text-foreground flex items-center gap-1">
                {finalValue}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </MotionConfig>
    </div>
  );
}
