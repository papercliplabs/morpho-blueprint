import { AnchorHTMLAttributes } from "react";

import { cn } from "@/utils/shadcn";

interface LinkExternalProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  keepReferrer?: boolean; // Allow sending our site as referrer
  noFollow?: boolean; // Prevent SEO endorsement
}

export default function LinkExternal({ href, keepReferrer, noFollow, className, ...props }: LinkExternalProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel={`noopener ${keepReferrer ? "" : "noreferrer"} ${noFollow ? "nofollow" : ""}`}
      className={cn(
        "text-primary underline-offset-2 transition-all hover:underline active:scale-98 active:opacity-50",
        className
      )}
      {...props}
    />
  );
}
