"use client";
import { ConnectKitProvider } from "connectkit";
import React, { type ReactNode } from "react";
import { WagmiProvider } from "wagmi";

import { wagmiConfig } from "./wagmi";

export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <ConnectKitProvider
        options={{
          avoidLayoutShift: false,
        }}
      >
        {children}
      </ConnectKitProvider>
    </WagmiProvider>
  );
}
