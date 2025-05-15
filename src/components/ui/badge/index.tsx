import { VariantProps, cva } from "class-variance-authority";

const badgeVariants = cva("bg-muted border-border text-muted-foreground rounded-sm border px-1", {
  variants: {
    variant: {
      default: "body-medium-plus",
      small: "body-small-plus",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

type BadgeProps = React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

function Badge({ children, className, variant, ...props }: BadgeProps) {
  return (
    <span className={badgeVariants({ className, variant })} {...props}>
      {children}
    </span>
  );
}

export { Badge };
