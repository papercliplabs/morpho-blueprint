"use client";
import { ArrowUpRight } from "lucide-react";
import type { AnchorHTMLAttributes, ComponentProps } from "react";
import type { Address } from "viem";
import { usePublicClient } from "wagmi";

import { formatAddress } from "@/utils/format";
import { cn } from "@/utils/shadcn";

interface LinkExternalProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  keepReferrer?: boolean; // Allow sending our site as referrer
  noFollow?: boolean; // Prevent SEO endorsement
  showArrow?: boolean;
}

export function LinkExternalUnstyled({
  href,
  children,
  keepReferrer,
  noFollow,
  className,
  ...props
}: LinkExternalProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel={`noopener ${keepReferrer ? "" : "noreferrer"} ${noFollow ? "nofollow" : ""}`}
      className={cn("text-inherit no-underline", className)}
      {...props}
    >
      {children}
    </a>
  );
}

export default function LinkExternal({ className, children, showArrow = false, ...props }: LinkExternalProps) {
  return (
    <LinkExternalUnstyled
      className={cn(
        "flex items-center gap-1 text-primary underline-offset-2 transition-all hover:underline active:scale-98 active:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      {showArrow && <ArrowUpRight className="aspect-square w-[1.1em] stroke-muted-foreground" />}
    </LinkExternalUnstyled>
  );
}

type LinkExternalBlockExplorerProps = Omit<ComponentProps<typeof LinkExternal>, "href"> & {
  chainId: number;
} & (
    | {
        type: "address";
        address?: Address;
      }
    | {
        type: "tx";
        txHash: Address;
      }
  );

export function LinkExternalBlockExplorer({ chainId, children, className, ...props }: LinkExternalBlockExplorerProps) {
  const { type } = props;
  const publicClient = usePublicClient({ chainId });

  let path: string;
  let displayName: string;
  switch (type) {
    case "address":
      if (!props.address) {
        return <div className={cn("text-muted-foreground", className)}>None</div>;
      }
      path = `/address/${props.address}`;
      displayName = formatAddress(props.address);
      break;
    case "tx":
      path = `/tx/${props.txHash}`;
      displayName = formatAddress(props.txHash);
      break;
  }

  return (
    <LinkExternal
      href={`${publicClient?.chain.blockExplorers?.default.url}${path}`}
      showArrow={true}
      className={cn("text-foreground hover:no-underline hover:brightness-90", className)}
      {...props}
    >
      {children ?? displayName}
    </LinkExternal>
  );
}
