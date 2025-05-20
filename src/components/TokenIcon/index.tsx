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
    chainSize: "2xs",
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
          <Avatar
            src={chain.icon}
            alt={chain.name}
            fallback={chain.name}
            size={SIZE_MAP[size].chainSize}
            className="border-background border-2"
          />
        ) : null
      }
      {...rest}
    />
  );
}
