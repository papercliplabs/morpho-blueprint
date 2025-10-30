import type { NextFontWithVariable } from "next/dist/compiled/@next/font";
import type { ReactNode } from "react";
import type { Address, Chain } from "viem";

import type { SUPPORTED_CHAIN_IDS, VAULT_TAG_OPTIONS } from "@/config";
import type { EventName } from "@/data/trackEvent";

// You shouldn't modify this file unless deploying a fully custom fork (otherwise the app will likely break)

// Used for type safety. SUPPORTED_CHAIN_IDS comes from ./index.ts and should contain all chain IDs your app supports
export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number];

// Windows available for native apy smoothing (1 day, 7 days, 30 days)
export type ApyWindow = "1d" | "7d" | "30d";

export type VaultTag = (typeof VAULT_TAG_OPTIONS)[number];

export interface VaultConfig {
  // Address of the vault
  readonly address: Address;
  // Vault name which will override the default one from Morpho metadata repo.
  readonly name?: string;
  // Vault description which will override the default one from Morpho metadata repo.
  readonly description?: string;
  // Optional tag which is used for sorting on the earn page, and a badge on the vault page.
  readonly tag?: VaultTag;
  // Optional flag to hide the vault from within the app, while still using the vault to compute TVL.
  readonly isHidden?: boolean;
}

export interface AppConfig {
  readonly metadata: {
    readonly url: string; // Base URL of your app. Should NOT have a trailing slash
    readonly name: string; // Name of your app used in the metadata tags and wallet connection modals
    readonly description: string; // Description of your app used in the metadata tags and wallet connection modals
    // Images can be an absolute or local path
    readonly images: {
      readonly opengraph: string; // Open Graph image, should be a 1200x630px .png file
      // App icon images - should all be the same image but different formats / sizes
      readonly icons: {
        readonly ico: string; // Legacy favicon
        readonly "png-64x64": string; // 64x64px png modern favicon
        readonly "png-192x192": string; // 192x192px png PWA manifest and apple touch icon
        readonly "png-512x512": string; // 512x512px png PWA manifest
        readonly svg: string; // 64x64px viewbox svg url for modern browsers
      };
    };
  };

  readonly ui: {
    readonly logo: {
      readonly mobile: ReactNode; // Logo in the left of the header for mobile screens.
      readonly desktop?: ReactNode; // (optional) Logo in left of the header for desktop screens. Mobile one will be used if this is not provided.
      readonly link?: string; // (optional) Link the logo will direct to. If not provided this will be the /earn page
    };
    readonly fonts: {
      readonly main: NextFontWithVariable; // Main font for the app. Variable name of font MUST be "--font-main"
      readonly others?: NextFontWithVariable[]; // (optional) Other fonts for the app. These are not used in core theme, but can be used in css variables directly for specifying typography in ./theme.css.
    };
    // Banner displayed at the top of the app above the nav bar.
    readonly infoBanner?: {
      readonly text: string;
      readonly link?: {
        readonly text: string;
        readonly href: string;
      };
    };
    // Links to be shown in the footer, note that if the compliance.termsOfUse or compliance.privacyPolicy are used their links will automatically be included in the footer after these
    readonly footerLinks?: {
      readonly text: string;
      readonly href: string;
    }[];
  };

  readonly compliance: {
    readonly termsOfUse?: ReactNode; // (optional) Terms of use content, will be displayed on the /terms page, and in the acceptance modal if compliance.requireTermsOfUseAcceptance is true
    readonly privacyPolicy?: ReactNode; // (optional) Privacy policy content, will be displayed on the /privacy page

    readonly requireTermsOfUseAcceptance?: boolean; // (optional) Controls if the terms of use acceptance is required before a user sends their first transaction. Must also provide compliance.termsOfUse otherwise this is ignored. Defaults to false.
    readonly countrySpecificDisclaimer?: Partial<Record<string, { readonly title: string; readonly text: string }>>; // (optional) Map of ISO 3166-2 country code to the country's disclaimer info. This will be shown as a banner at the top of the app above the nav bar (below the infoBanner) with a button that opens a modal with the full text content.
  };

  readonly reownProjectId: string; // Reown/wallet connect project ID. Get this from https://cloud.reown.com
  readonly chainConfig: Record<SupportedChainId, { readonly chain: Chain; readonly rpcUrls: [string, ...string[]] }>; // Chain configuration for all chains your app supports
  readonly maxRpcBatchSize: number; // Maximum number of RPC calls to batch in a single http request

  readonly supportedVaults: Record<SupportedChainId, VaultConfig[]>; // Config for all supported vaults which will appear in the earn page table.
  // Note: Supported markets are derived based on supported vault allocations^

  readonly actionParameters: {
    // controls the max borrow origination based on LLTV (maxBorrowLtv = LLTV - maxBorrowLtvMarginWad)
    readonly maxBorrowLtvMarginWad: bigint; // Scaled by WAD
    // Target utilization above which the public allocator shared liquidity algorithm is enabled for borrowing
    readonly publicAllocatorSupplyTargetUtilizationWad: bigint; // Scaled by WAD

    // Configuration for bundler3 support.
    // NOTE: currently this only controls vault actions, market actions use bundler3 and a default slippage.
    //       in the future this will control both vault and market actions.
    readonly bundler3Config: "disabled" | { readonly slippageToleranceWad: bigint };
  };

  // Controls the apy window used for native apy metrics and charts (rewards remain instantanious).
  // Instantaneous APYs can be misleading, so we've opted to show windowed instead which is generlly more useful for users.
  readonly apyWindow: ApyWindow;

  // Note the default value is false to preserve backwards compatibility when upgrading versions (new features are opt-in, i.e upgrading won't add any new features)
  readonly featureFlags: {
    readonly enableDarkModeToggle?: boolean; // (optional) Controls if the dark mode toggle is shown in the footer. If so .dark should be defined in theme.css
    readonly hideCurator?: boolean; // (optional) Controls if the curator should be hidden throughout the app which can be useful when there is only a single curator
  };

  readonly analytics: {
    readonly component?: ReactNode; // (optional) Component to be rendered in the root layout which can be used to inject analytics scripts.
    readonly eventCb?: (name: EventName, payload: Record<string, string | number>) => void; // (optional) Callback when app event is received. This call routes through a server action to prevent client-side blocking.
  };

  // Map of known addresses to friendly display metadata. If an address is present here,
  // the app will render the friendly name (and optional icon) instead of the raw address
  // wherever addresses are displayed.
  readonly knownAddresses: Record<Address, { name: string; iconUrl?: string }>;
}
