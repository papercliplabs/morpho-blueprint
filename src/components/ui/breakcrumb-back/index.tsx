import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ComponentProps } from "react";

import { cn } from "@/utils/shadcn";

interface BreakcrumbBackProps extends Omit<ComponentProps<typeof Link>, "children"> {
  label: string;
}

export function BreakcrumbBack({ label, className, ...props }: BreakcrumbBackProps) {
  return (
    <Link
      className={cn(
        "text-muted-foreground body-medium-plus hover:text-foreground flex w-fit items-center gap-1 transition-all active:scale-95",
        className
      )}
      {...props}
    >
      <ArrowLeft className="size-4" />
      <span>{label}</span>
    </Link>
  );
}
