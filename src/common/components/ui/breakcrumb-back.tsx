import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/common/utils/shadcn";

interface BreakcrumbBackProps extends Omit<ComponentProps<typeof Link>, "children"> {
  label: string;
}

export function BreakcrumbBack({ label, className, ...props }: BreakcrumbBackProps) {
  return (
    <Link
      className={cn(
        "body-medium-plus flex w-fit items-center gap-1 text-muted-foreground transition-all hover:text-foreground active:scale-95",
        className,
      )}
      {...props}
    >
      <ArrowLeft className="size-4" />
      <span>{label}</span>
    </Link>
  );
}
