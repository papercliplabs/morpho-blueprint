import { NextFontWithVariable } from "next/dist/compiled/@next/font";
import { ReactNode } from "react";
import { Address, Chain } from "viem";

import { SUPPORTED_CHAIN_IDS } from "@/config";

// You shouldn't modify this file unless deploying a full custom fork

export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number];

export interface AppConfig {
  reownProjectId: string;
  chainConfig: Record<SupportedChainId, { chain: Chain; rpcUrls: [string, ...string[]] }>;
  metadata: {
    appName: string;
    appDescription: string;
    appIcon: string;
    logoComponent: ReactNode;
  };
  links: {
    termsOfService?: string;
    privacyPolicy?: string;
    support?: string;
  };
  whitelistedVaults: Record<SupportedChainId, Address[]>;
  // Whitelisted markets are derived based on whitelisted vault allocations
  actionParameters: {
    // [0, 1], Only allow a max borrow origination of up to this % below LLTV
    maxBorrowLtvMargin: number;
    // Target utilization above which the public allocator shared liquidity algorithm is enabled for borrowing (WAD)
    publicAllocatorSupplyTargetUtilizationWad: bigint; // Scaled by WAD
  };
  featureFlags: {
    darkModeToggle: boolean;
  };
  fonts: {
    main: NextFontWithVariable; // Veriable name must be "--font-main"
    others?: NextFontWithVariable[]; // These are not used in core theme, but you can use css variables directly for typography
  };
}
