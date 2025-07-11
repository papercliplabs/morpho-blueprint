import Image from "next/image";
import type { ComponentProps } from "react";

import type { ChainInfo, TokenInfo } from "@/data/whisk/fragments";
import { cn } from "@/utils/shadcn";

import { Avatar, type AvatarProps } from "../ui/avatar";

interface TokenIconProps extends Omit<ComponentProps<typeof Avatar>, "src" | "alt" | "fallback" | "size" | "sub"> {
  token: TokenInfo;
  chain: ChainInfo;
  size: "sm" | "md" | "lg";
  showChain?: boolean;
  chainClassName?: string;
}

const SIZE_MAP: Record<TokenIconProps["size"], { tokenSize: AvatarProps["size"]; chainSize: AvatarProps["size"] }> = {
  sm: {
    tokenSize: "sm",
    chainSize: "xs",
  },
  md: {
    tokenSize: "md",
    chainSize: "xs",
  },
  lg: {
    tokenSize: "lg",
    chainSize: "sm",
  },
};

export function TokenIcon({ chainClassName, token, chain, size, showChain = true, ...rest }: TokenIconProps) {
  return (
    <Avatar
      src={token.icon}
      size={SIZE_MAP[size].tokenSize}
      alt={token.symbol}
      sub={
        showChain ? (
          <Image
            src={chain.icon}
            alt={chain.name}
            width={16}
            height={16}
            className={cn("rounded-[6px] border-1 border-background transition-colors", chainClassName)}
          />
        ) : null
      }
      {...rest}
    />
  );
}
