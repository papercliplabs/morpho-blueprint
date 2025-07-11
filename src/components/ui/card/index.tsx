import { cn } from "@/utils/shadcn";

type CardProps = React.ComponentProps<"div">;
type CardHeaderProps = React.ComponentProps<"div">;

function Card({ children, className, ...props }: CardProps) {
  return (
    <article className={cn("rounded-lg border border-border bg-card p-6 shadow-sm", className)} {...props}>
      {children}
    </article>
  );
}

function CardHeader({ children, className, ...props }: CardHeaderProps) {
  return (
    <header className={cn("pb-4", className)} {...props}>
      <span className="heading-6">{children}</span>
    </header>
  );
}

export { Card, CardHeader };
