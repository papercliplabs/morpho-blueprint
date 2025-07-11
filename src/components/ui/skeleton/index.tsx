import type { ComponentProps } from "react";

import { cn } from "@/utils/shadcn";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" className={cn("animate-pulse rounded-md bg-accent", className)} {...props} />;
}

function Skeletons({ count, ...props }: { count: number } & ComponentProps<typeof Skeleton>) {
  return (
    Array(count)
      .fill(0)
      // biome-ignore lint/suspicious/noArrayIndexKey: no suitable key
      .map((_, i) => <Skeleton key={i} {...props} />)
  );
}

export { Skeleton, Skeletons };
