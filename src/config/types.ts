import { NextFontWithVariable } from "next/dist/compiled/@next/font";
import { ReactNode } from "react";
import { Address, Chain } from "viem";

import { SUPPORTED_CHAIN_IDS } from "@/config";

// You shouldn't modify this file unless deploying a full custom fork (otherwise the app will likely break)

// Used for type safety. SUPPORTED_CHAIN_IDS comes from the config file, and should contain all chain IDs your app supports
export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number];

export interface AppConfig {
  appMetadata: {
    url: string; // Base URL of your app. Should NOT have a trailing slash
    name: string; // Name of your app used in the metadata tags and wallet connection modals
    description: string; // Description of your app used in the metadata tags and wallet connection modals
    // Images can be an absolute or local path
    images: {
      opengraph: string; // Open Graph image, should be a 1200x630px .png file
      // App icon images - should all be the same image but different formats / sizes
      icons: {
        ico: string; // Legacy favicon
        "png-64x64": string; // 64x64px png modern favicon
        "png-192x192": string; // 192x192px png PWA manifest and apple touch icon
        "png-512x512": string; // 512x512px png PWA manifest
        svg: string; // 64x64px viewbox svg for modern browers
      };
    };
    logoComponent: ReactNode; // App logo displayed in the left corner of the header
    links: {
      termsOfService?: string; // (optional) Terms of service link in the footer and in wallet connection modal
      privacyPolicy?: string; // (optional) Privacy policy link in the footer and in wallet connection modal
      support?: string; // (optional) Support link in the footer
    };
  };
  reownProjectId: string; // Reown/wallet connect project ID. Get this from https://cloud.reown.com
  chainConfig: Record<SupportedChainId, { chain: Chain; rpcUrls: [string, ...string[]] }>; // Chain configuration for all chains your app supports
  whitelistedVaults: Record<SupportedChainId, Address[]>; // List of all supported vaults which will appear in the earn page table.
  // Note: Whitelisted markets are derived based on whitelisted vault allocations^
  actionParameters: {
    // [0, 1], controls the max borrow origination based on LLTV (maxBorrowLtv = LLTV - maxBorrowLtvMargin)
    maxBorrowLtvMargin: number;
    // Target utilization above which the public allocator shared liquidity algorithm is enabled for borrowing
    publicAllocatorSupplyTargetUtilizationWad: bigint; // Scaled by WAD
  };
  featureFlags: {
    curatorColumn: boolean; // Controls if the curator column should be shown on the earn pages table
    darkModeToggle: boolean; // Controls if the dark mode toggle should be shown in the footer
  };
  fonts: {
    main: NextFontWithVariable; // Main font for the app. Variable name of font MUST be "--font-main"
    others?: NextFontWithVariable[]; // (optional) Other fonts for the app. These are not used in core theme, but you be used in css variables directly for specifying typography in ./theme.css.
  };
}
