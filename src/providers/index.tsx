"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ResponsiveProvider } from "@/providers/ResponsiveProvider";

import { TanstackQueryProvider } from "./TanstackQueryProvider";
import { ThemeProvider } from "./ThemeProvider";
import { WalletProvider } from "./WalletProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <WalletProvider>
        <TanstackQueryProvider>
          <TooltipProvider>
            <ResponsiveProvider>{children}</ResponsiveProvider>
          </TooltipProvider>
        </TanstackQueryProvider>
      </WalletProvider>
    </ThemeProvider>
  );
}
