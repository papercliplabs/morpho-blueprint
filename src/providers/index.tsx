"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ResponsiveProvider } from "@/providers/ResponsiveProvider";

import { ThemeProvider } from "./ThemeProvider";
import { WalletProvider } from "./WalletProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <WalletProvider>
        <TooltipProvider>
          <ResponsiveProvider>{children}</ResponsiveProvider>
        </TooltipProvider>
      </WalletProvider>
    </ThemeProvider>
  );
}
