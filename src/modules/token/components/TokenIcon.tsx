import Image from "next/image";
import type { ComponentProps } from "react";
import type { ChainInfo, TokenInfo } from "@/common/data/types";
import { cn } from "@/common/utils/shadcn";

import { Avatar, type AvatarProps } from "../../../common/components/ui/avatar";

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
        // The CDN does not host an icon for every chain, so the badge is dropped rather than
        // rendered broken when one is missing.
        showChain && chain.icon ? (
          <Image
            src={chain.icon}
            alt={chain.name}
            width={18}
            height={18}
            // The border is box-sizing: border-box, so it eats into the 18px and reads as a gap
            // between the badge and the token icon it overlaps — hence the surface-matched color.
            // The background matches it too: the artwork's own circle is antialiased against the
            // identical `rounded-full` edge, and without it that seam lets the token icon show
            // through. Call sites overriding one color must override both.
            className={cn("rounded-full border-2 border-background bg-background transition-colors", chainClassName)}
          />
        ) : null
      }
      {...rest}
    />
  );
}
