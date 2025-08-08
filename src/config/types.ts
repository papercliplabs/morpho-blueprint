import type { NextFontWithVariable } from "next/dist/compiled/@next/font";
import type { ReactNode } from "react";
import type { Address, Chain } from "viem";

import type { SUPPORTED_CHAIN_IDS } from "@/config";
import type { EventName } from "@/data/trackEvent";

// You shouldn't modify this file unless deploying a fully custom fork (otherwise the app will likely break)

// Used for type safety. SUPPORTED_CHAIN_IDS comes from ./index.ts and should contain all chain IDs your app supports
export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number];

// Extendable by app implementers to enumerate the set of tags used for vaults.
// Update this union to match your design taxonomy (e.g. "Prime" | "High-Yield" | "Tactical").
export type VaultTag = "Prime" | "High-Yield" | "Tactical";

export interface VaultConfig {
  address: Address;
  description?: string;
  tag?: VaultTag;
}

export interface AppConfig {
  metadata: {
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
        svg: string; // 64x64px viewbox svg url for modern browsers
      };
    };
  };

  ui: {
    logo: {
      mobile: ReactNode; // Logo in the left of the header for mobile screens.
      desktop?: ReactNode; // (optional) Logo in left of the header for desktop screens. Mobile one will be used if this is not provided.
      link?: string; // (optional) Link the logo will direct to. If not provided this will be the /earn page
    };
    fonts: {
      main: NextFontWithVariable; // Main font for the app. Variable name of font MUST be "--font-main"
      others?: NextFontWithVariable[]; // (optional) Other fonts for the app. These are not used in core theme, but can be used in css variables directly for specifying typography in ./theme.css.
    };
    // Banner displayed at the top of the app above the nav bar.
    infoBanner?: {
      text: string;
      link?: {
        text: string;
        href: string;
      };
    };
    // Links to be shown in the footer, note that if the compliance.termsOfUse or compliance.privacyPolicy are used their links will automatically be included in the footer after these
    footerLinks?: {
      text: string;
      href: string;
    }[];
  };

  compliance: {
    termsOfUse?: ReactNode; // (optional) Terms of use content, will be displayed on the /terms page, and in the acceptance modal if compliance.requireTermsOfUseAcceptance is true
    privacyPolicy?: ReactNode; // (optional) Privacy policy content, will be displayed on the /privacy page

    requireTermsOfUseAcceptance?: boolean; // (optional) Controls if the terms of use acceptance is required before a user sends their first transaction. Must also provide compliance.termsOfUse otherwise this is ignored. Defaults to false.
    countrySpecificDisclaimer?: Partial<Record<string, { title: string; text: string }>>; // (optional) Map of ISO 3166-2 country code to the country's disclaimer info. This will be shown as a banner at the top of the app above the nav bar (below the infoBanner) with a button that opens a modal with the full text content.
  };

  reownProjectId: string; // Reown/wallet connect project ID. Get this from https://cloud.reown.com
  chainConfig: Record<SupportedChainId, { chain: Chain; rpcUrls: [string, ...string[]] }>; // Chain configuration for all chains your app supports

  supportedVaults: Record<SupportedChainId, VaultConfig[]>; // List of all supported vaults which will appear in the earn page table.
  // Note: Supported markets are derived based on supported vault allocations^

  actionParameters: {
    // [0, 1] controls the max borrow origination based on LLTV (maxBorrowLtv = LLTV - maxBorrowLtvMargin)
    maxBorrowLtvMargin: number;
    // Target utilization above which the public allocator shared liquidity algorithm is enabled for borrowing
    publicAllocatorSupplyTargetUtilizationWad: bigint; // Scaled by WAD
  };

  // Map of known addresses to friendly display metadata. If an address is present here,
  // the app will render the friendly name (and optional icon) instead of the raw address
  // wherever addresses are displayed.
  knownAddresses: Map<Address, { name: string; iconUrl?: string }>;

  // Note the default value is false to preserve backwards compatibility when upgrading versions (new features are opt-in, i.e upgrading won't add any new features)
  featureFlags: {
    enableDarkModeToggle?: boolean; // (optional) Controls if the dark mode toggle is shown in the footer. If so .dark should be defined in theme.css
    hideCurator?: boolean; // (optional) Controls if the curator should be hidden throughout the app which can be useful when there is only a single curator
  };

  analytics: {
    component?: ReactNode; // (optional) Component to be rendered in the root layout which can be used to inject analytics scripts.
    eventCb?: (name: EventName, payload: Record<string, string | number>) => void; // (optional) Callback when app event is received. This call routes through a server action to prevent client-side blocking.
  };
}
