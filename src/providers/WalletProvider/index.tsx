"use client";
import { ConnectKitProvider } from "connectkit";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "./wagmi";

export function WalletProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  return (
    <WagmiProvider config={wagmiConfig}>
      <ConnectKitProvider
        options={{
          avoidLayoutShift: false,
        }}
        mode={resolvedTheme === "dark" ? "dark" : "light"}
      >
        {children}
      </ConnectKitProvider>
    </WagmiProvider>
  );
}
