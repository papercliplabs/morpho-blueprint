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
        customTheme={{
          "--ck-primary-button-color": "var(--primary-foreground)",
          "--ck-primary-button-background": "var(--primary)",
          "--ck-primary-button-border-radius": "var(--button-radius, var(--radius))",

          "--ck-secondary-button-color": "var(--secondary-foreground)",
          "--ck-secondary-button-background": "var(--secondary)",
          "--ck-secondary-button-border-radius": "var(--button-radius, var(--radius))",

          "--ck-border-radius": "var(--radius)",
          "--ck-body-background": "var(--background)",
          "--ck-body-background-secondary": "var(--muted)",
          "--ck-body-background-tertiary": "var(--card)",

          "--ck-font-family": "inherit",
          "--ck-body-color": "var(--foreground)",
          "--ck-body-color-muted": "var(--muted-foreground)",
          "--ck-body-color-danger": "var(--destructive)",
          "--ck-body-color-valid": "var(--primary)",
          "--ck-body-action-color": "var(--muted-foreground)",

          "--ck-focus-color": "var(--ring)",
          "--ck-body-divider": "var(--border)",
          "--ck-qr-dot-color": "var(--foreground)",
          "--ck-qr-border-color": "var(--border)",
          "--ck-spinner-color": "var(--primary)",
        }}
      >
        {children}
      </ConnectKitProvider>
    </WagmiProvider>
  );
}
