"use client";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { AnchorHTMLAttributes, ComponentProps } from "react";
import { Address } from "viem";
import { usePublicClient } from "wagmi";

import { KNOWN_ADDRESSES } from "@/config";
import { formatAddress } from "@/utils/format";
import { cn } from "@/utils/shadcn";

interface LinkExternalProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  keepReferrer?: boolean; // Allow sending our site as referrer
  noFollow?: boolean; // Prevent SEO endorsement
  showArrow?: boolean;
}

export default function LinkExternal({
  href,
  keepReferrer,
  noFollow,
  className,
  children,
  showArrow = false,
  ...props
}: LinkExternalProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel={`noopener ${keepReferrer ? "" : "noreferrer"} ${noFollow ? "nofollow" : ""}`}
      className={cn(
        "text-primary flex items-center gap-2 underline-offset-2 transition-all hover:underline active:scale-98 active:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      {showArrow && <ArrowUpRight className="stroke-muted-foreground aspect-square w-[1.1em]" />}
    </a>
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
  let displayIcon: string | undefined = undefined;
  switch (type) {
    case "address":
      if (!props.address) {
        return <div className={cn("text-muted-foreground", className)}>None</div>;
      }
      path = `/address/${props.address}`;
      const knownAddress = KNOWN_ADDRESSES[props.address];
      displayName = knownAddress?.name ?? formatAddress(props.address);
      displayIcon = knownAddress?.iconSrc;
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
      className={cn("text-foreground hover:no-underline", className)}
      {...props}
    >
      {children ?? (
        <>
          {displayName}
          {displayIcon && (
            <Image
              src={displayIcon}
              width={24}
              height={24}
              alt={displayName}
              className="h-6 w-6 shrink-0 rounded-[4px] border"
            />
          )}
        </>
      )}
    </LinkExternal>
  );
}
