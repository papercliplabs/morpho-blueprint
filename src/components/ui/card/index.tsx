import { cn } from "@/utils/shadcn";

type CardProps = React.ComponentProps<"div">;
type CardHeaderProps = React.ComponentProps<"div">;

function Card({ children, className, ...props }: CardProps) {
  return (
    <article className={cn("bg-card border-border rounded-lg border p-6 shadow-sm", className)} {...props}>
      {children}
    </article>
  );
}

function CardHeader({ children, className, ...props }: CardHeaderProps) {
  return (
    <header className={cn("pb-6", className)} {...props}>
      <span className="heading-6">{children}</span>
    </header>
  );
}

export { Card, CardHeader };
