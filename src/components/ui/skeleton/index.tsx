import { cn } from "@/utils/shadcn";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" className={cn("bg-accent animate-pulse rounded-md", className)} {...props} />;
}
function Skeletons({ count, ...props }: { count: number } & React.ComponentProps<typeof Skeleton>) {
  return Array(count)
    .fill(0)
    .map((_, i) => <Skeleton key={i} {...props} />);
}

export { Skeleton, Skeletons };
