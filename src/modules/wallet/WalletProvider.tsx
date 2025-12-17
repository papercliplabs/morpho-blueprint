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
          initialChainId: 0, // Allow whatever chain the wallet is on. This is needed for wallets which only support certain chains like safe.
        }}
        mode={resolvedTheme === "dark" ? "dark" : "light"}
      >
        {children}
      </ConnectKitProvider>
    </WagmiProvider>
  );
}
