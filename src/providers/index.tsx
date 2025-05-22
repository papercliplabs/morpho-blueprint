"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ResponsiveProvider } from "@/providers/ResponsiveProvider";

import { TanstackQueryProvider } from "./TanstackQueryProvider";
import { ThemeProvider } from "./ThemeProvider";
import { WalletProvider } from "./WalletProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TanstackQueryProvider>
        <WalletProvider>
          <ResponsiveProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </ResponsiveProvider>
        </WalletProvider>
      </TanstackQueryProvider>
    </ThemeProvider>
  );
}
