import { ChainInfo, TokenInfo } from "@/data/whisk/fragments";

import { Avatar, AvatarProps } from "../ui/avatar";

interface TokenIconProps {
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

export function TokenIcon({ token, chain, size, showChain = true }: TokenIconProps) {
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
    />
  );
}
