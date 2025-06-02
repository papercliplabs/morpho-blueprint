import { Inter } from "next/font/google";
import { getAddress } from "viem";
import { base, mainnet, polygon, worldchain } from "viem/chains";

import { Logo } from "./components/Logo";
import { AppConfig } from "./types";

export const SUPPORTED_CHAIN_IDS = [mainnet.id, polygon.id, base.id, worldchain.id] as const;

const inter = Inter({
  variable: "--font-main",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const APP_CONFIG: AppConfig = {
  reownProjectId: "0bd03f980c18061297ab3a379e97dba0",
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
  appMetadata: {
    url: process.env.NEXT_PUBLIC_URL!,
    name: "Morpho",
    description: "Morpho",
    icon: "/vercel.svg",
    logoComponent: Logo(),
  },
  links: {
    termsOfService: undefined,
    privacyPolicy: undefined,
    support: undefined,
  },
  whitelistedVaults: {
    [mainnet.id]: [
      getAddress("0x95EeF579155cd2C5510F312c8fA39208c3Be01a8"), // USDT
      // getAddress("0x78Fc2c2eD1A4cDb5402365934aE5648aDAd094d0"), // WETH
      // getAddress("0x60d715515d4411f7F43e4206dc5d4a3677f0eC78"), // USDC
      // getAddress("0x4F460bb11cf958606C69A963B4A17f9DaEEea8b6"), // USDC (fx protocol collateral tokens)
      // getAddress("0xE0C98605f279e4D7946d25B75869c69802823763"), // WBTC
      // getAddress("0xA02F5E93f783baF150Aa1F8b341Ae90fe0a772f7"), // cbBTC
      getAddress("0xBE40491F3261Fd42724F1AEb465796eb11c06ddF"), // FRAX
      // getAddress("0x89D80f5e9BC88d8021b352064ae73F0eAf79EBd8"), // USDA
      // getAddress("0x43fD147d5319B8Cf39a6e57143684Efca9CF3613"), // tBTC
      // getAddress("0x64964E162Aa18d32f91eA5B24a09529f811AEB8e"), // USDC (prime)
    ],
    [base.id]: [
      // getAddress("0xbb819D845b573B5D7C538F5b85057160cfb5f313"), // eUSD
      // getAddress("0xB7890CEE6CF4792cdCC13489D36D9d42726ab863"), // USDC (universal collateral assets)
      getAddress("0x12AFDeFb2237a5963e7BAb3e2D46ad0eee70406e"), // USDC
      // getAddress("0x6e37C95b43566E538D8C278eb69B00FC717a001b"), // verUSDC (against RWA)
      // getAddress("0xA2Cac0023a4797b4729Db94783405189a4203AFc"), // WETH
      // getAddress("0x80D9964fEb4A507dD697b4437Fc5b25b618CE446"), // WETH (pyth oracles only)
      // getAddress("0x0FaBfEAcedf47e890c50C8120177fff69C6a1d9B"), // USDC (pyth oracles only)
      // getAddress("0x30B8A2c8E7Fa41e77b54b8FaF45c610e7aD909E3"), // MAI
      getAddress("0x8c3A6B12332a6354805Eb4b72ef619aEdd22BcdD"), // Degen
      // getAddress("0xdB90A4e973B7663ce0Ccc32B6FbD37ffb19BfA83"), // USDC (degen collateral)
      // getAddress("0x00dfDb8C7295a03DCf1ADfF4D21eB5D9D19FB330"), // Resolv USR
    ],
    [worldchain.id]: [
      getAddress("0x0db7e405278c2674f462ac9d9eb8b8346d1c1571"), // WETH
      getAddress("0x348831b46876d3df2db98bdec5e3b4083329ab9f"), // WLD
      getAddress("0xb1e80387ebe53ff75a89736097d34dc8d9e9045b"), // USDC
      // getAddress("0xbc8c37467c5df9d50b42294b8628c25888becf61"), // WBTC
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
  },
  fonts: {
    main: inter,
  },
};
