import { cva } from "class-variance-authority";
import clsx from "clsx";
import { Check, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

type StepStatus = "active" | "pending" | "complete" | "upcoming";

type StepProps = {
  number: number;
  status: StepStatus;
  label: ReactNode;
  icon?: ReactNode;
} & React.ComponentProps<"div">;

const iconVariants = cva(
  "body-small-plus flex size-6 items-center justify-center rounded-full border transition overflow-hidden",
  {
    variants: {
      status: {
        active: "border-primary bg-background text-foreground",
        upcoming: "border-border bg-muted text-muted-foreground",
        complete: "border-primary bg-primary text-background",
        pending: "border-none",
      },
    },
    defaultVariants: {
      status: "upcoming",
    },
  },
);

function StepIcon({ children, status }: Pick<StepProps, "children" | "status">) {
  switch (status) {
    case "active":
    case "upcoming":
      return children;
    case "pending":
      return <LoaderCircle className="animate-spin text-primary" />;
    case "complete":
      return <Check className="size-4" />;
  }
}

function Step({ number, status, label, icon }: StepProps) {
  return (
    <div className="flex items-center gap-4">
      <div className={iconVariants({ status })}>
        <StepIcon status={status}>{icon ? icon : number}</StepIcon>
      </div>
      <span
        className={clsx(
          "body-medium-plus transition-colors",
          status === "active" ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </div>
  );
}

export { Step, type StepProps };
