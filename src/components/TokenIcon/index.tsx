import Image from "next/image";
import { ComponentProps } from "react";

import { ChainInfo, TokenInfo } from "@/data/whisk/fragments";

import { Avatar, AvatarProps } from "../ui/avatar";

interface TokenIconProps extends Omit<ComponentProps<typeof Avatar>, "src" | "alt" | "fallback" | "size" | "sub"> {
  token: TokenInfo;
  chain: ChainInfo;
  size: "sm" | "md" | "lg";
  showChain?: boolean;
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

export function TokenIcon({ token, chain, size, showChain = true, ...rest }: TokenIconProps) {
  return (
    <Avatar
      src={token.icon}
      fallback={token.symbol}
      size={SIZE_MAP[size].tokenSize}
      alt={token.symbol}
      sub={
        showChain ? (
          <Image
            src={chain.icon}
            alt={chain.name}
            width={16}
            height={16}
            className="border-background rounded-[6px] border-2"
          />
        ) : null
      }
      {...rest}
    />
  );
}
