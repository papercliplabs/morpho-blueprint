"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ResponsiveProvider } from "@/providers/ResponsiveProvider";

import { WalletProvider } from "./WalletProvider";

export default function Providers({ children, cookies }: { children: React.ReactNode; cookies: string | null }) {
  return (
    <WalletProvider cookies={cookies}>
      <TooltipProvider>
        <ResponsiveProvider>{children}</ResponsiveProvider>
      </TooltipProvider>
    </WalletProvider>
  );
}
