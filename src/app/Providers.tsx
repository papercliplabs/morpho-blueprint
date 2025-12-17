"use client";

import { TooltipProvider } from "@/common/components/ui/tooltip";
import { ResponsiveProvider } from "@/common/providers/ResponsiveProvider";
import { ThemeProvider } from "@/common/providers/ThemeProvider";
import { WalletProvider } from "@/modules/wallet/WalletProvider";
import { TanstackQueryProvider } from "../common/providers/TanstackQueryProvider";
import { AcknowledgeTermsProvider } from "../modules/compliance/AcknowledgeTermsProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TanstackQueryProvider>
        <WalletProvider>
          <AcknowledgeTermsProvider>
            <ResponsiveProvider>
              <TooltipProvider>{children}</TooltipProvider>
            </ResponsiveProvider>
          </AcknowledgeTermsProvider>
        </WalletProvider>
      </TanstackQueryProvider>
    </ThemeProvider>
  );
}
