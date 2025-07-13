import { Inter } from "next/font/google";
import { getAddress } from "viem";
import { base, mainnet, polygon, worldchain } from "viem/chains";
import { eventCb } from "./callbacks";
import Analytics from "./components/Analytics";
import { LogoDesktop, LogoMobile } from "./components/Logo";
import { PrivacyPolicy } from "./components/PrivacyPolicy";
import { TermsOfUse } from "./components/TermsOfUse";
import type { AppConfig } from "./types";

export const SUPPORTED_CHAIN_IDS = [mainnet.id, polygon.id, base.id, worldchain.id] as const;

const inter = Inter({
  variable: "--font-main",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const APP_CONFIG: AppConfig = {
  metadata: {
    url: process.env.NEXT_PUBLIC_URL!,
    name: "Morpho Blueprint",
    description: "An open source fully customizable whitelabeled frontend template for Morpho apps.",
    images: {
      opengraph: "/opengraph-image.png",
      icons: {
        ico: "/icon.ico",
        "png-64x64": "/icon-64x64.png",
        "png-192x192": "/icon-192x192.png",
        "png-512x512": "/icon-512x512.png",
        svg: "/icon.svg",
      },
    },
  },

  ui: {
    logo: {
      mobile: LogoMobile(),
      desktop: LogoDesktop(),
    },
    fonts: {
      main: inter,
    },
    infoBanner: {
      text: "Morpho Blueprint Demo. Build custom interfaces in hours, not weeks.",
      link: {
        text: "Get my own!",
        href: "https://paperclip.xyz/contact",
      },
    },
    footerLinks: [
      {
        text: "Github",
        href: "https://github.com/papercliplabs/morpho-blueprint",
      },
      {
        text: "Contact",
        href: "https://paperclip.xyz/contact",
      },
    ],
  },

  compliance: {
    termsOfUse: TermsOfUse(),
    privacyPolicy: PrivacyPolicy(),

    requireTermsOfUseAcceptance: false,
  },

  reownProjectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID!,
  chainConfig: {
    [mainnet.id]: {
      chain: mainnet,
      rpcUrls: [process.env.NEXT_PUBLIC_MAINNET_RPC_URL_1!, process.env.NEXT_PUBLIC_MAINNET_RPC_URL_2!],
    },
    [base.id]: {
      chain: base,
      rpcUrls: [process.env.NEXT_PUBLIC_BASE_RPC_URL_1!, process.env.NEXT_PUBLIC_BASE_RPC_URL_2!],
    },
    [worldchain.id]: {
      chain: worldchain,
      rpcUrls: [process.env.NEXT_PUBLIC_WORLDCHAIN_RPC_URL_1!, process.env.NEXT_PUBLIC_WORLDCHAIN_RPC_URL_2!],
    },
    [polygon.id]: {
      chain: polygon,
      rpcUrls: [process.env.NEXT_PUBLIC_POLYGON_RPC_URL_1!, process.env.NEXT_PUBLIC_POLYGON_RPC_URL_2!],
    },
  },
  supportedVaults: {
    [mainnet.id]: [
      getAddress("0x95EeF579155cd2C5510F312c8fA39208c3Be01a8"), // USDT
      getAddress("0xBE40491F3261Fd42724F1AEb465796eb11c06ddF"), // FRAX
    ],
    [base.id]: [
      getAddress("0x12AFDeFb2237a5963e7BAb3e2D46ad0eee70406e"), // USDC
      getAddress("0x8c3A6B12332a6354805Eb4b72ef619aEdd22BcdD"), // Degen
    ],
    [worldchain.id]: [
      getAddress("0x0db7e405278c2674f462ac9d9eb8b8346d1c1571"), // WETH
      getAddress("0x348831b46876d3df2db98bdec5e3b4083329ab9f"), // WLD
      getAddress("0xb1e80387ebe53ff75a89736097d34dc8d9e9045b"), // USDC
    ],
    [polygon.id]: [
      getAddress("0xF91D80E43272DBC610551E8c872E0438d62C1c69"), // WPOL
    ],
  },

  actionParameters: {
    maxBorrowLtvMargin: 0.05,
    publicAllocatorSupplyTargetUtilizationWad: BigInt(90_0000000000000000),
  },

  featureFlags: {
    curatorColumn: true,
    darkModeToggle: true,
    showUnsupportedVaults: true,
  },

  analytics: {
    component: Analytics(),
    eventCb,
  },
};
