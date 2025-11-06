import { Inter } from "next/font/google";
import { getAddress, parseUnits } from "viem";
import {
  arbitrum,
  base,
  berachain,
  corn,
  hemi,
  katana,
  lisk,
  mainnet,
  plumeMainnet,
  polygon,
  soneium,
  tac,
  unichain,
  worldchain,
} from "viem/chains";
import { eventCb } from "./callbacks";
import { Analytics } from "./components/Analytics";
import { LogoDesktop, LogoMobile } from "./components/Logo";
import { PrivacyPolicy } from "./components/PrivacyPolicy";
import { TermsOfUse } from "./components/TermsOfUse";
import type { AppConfig } from "./types";

// Specify all chains your app supports
export const SUPPORTED_CHAIN_IDS = [
  mainnet.id,
  base.id,
  polygon.id,
  unichain.id,
  katana.id,
  arbitrum.id,
  hemi.id,
  lisk.id,
  soneium.id,
  plumeMainnet.id,
  tac.id,
  worldchain.id,
  corn.id,
  berachain.id,
] as const;

// Custom tags for your vaults which can be used within the VaultConfig
// These are used for sorting on the earn page, and a badge on the vault page
export const VAULT_TAG_OPTIONS = [] as const;

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
      text: "Morpho Blueprint Demo. Build custom interfaces in days, not weeks.",
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
      rpcUrls: [process.env.MAINNET_RPC_URL_1!, process.env.MAINNET_RPC_URL_2!],
    },
    [base.id]: {
      chain: base,
      rpcUrls: [process.env.BASE_RPC_URL_1!, process.env.BASE_RPC_URL_2!],
    },
    [polygon.id]: {
      chain: polygon,
      rpcUrls: [process.env.POLYGON_RPC_URL_1!, process.env.POLYGON_RPC_URL_2!],
    },
    [unichain.id]: {
      chain: unichain,
      rpcUrls: [process.env.UNICHAIN_RPC_URL_1!, process.env.UNICHAIN_RPC_URL_2!],
    },
    [katana.id]: {
      chain: katana,
      rpcUrls: [process.env.KATANA_RPC_URL_1!, process.env.KATANA_RPC_URL_2!],
    },
    [arbitrum.id]: {
      chain: arbitrum,
      rpcUrls: [process.env.ARBITRUM_RPC_URL_1!, process.env.ARBITRUM_RPC_URL_2!],
    },
    [hemi.id]: {
      chain: hemi,
      rpcUrls: [process.env.HEMI_RPC_URL_1!, process.env.HEMI_RPC_URL_2!],
    },
    [lisk.id]: {
      chain: lisk,
      rpcUrls: [process.env.LISK_RPC_URL_1!, process.env.LISK_RPC_URL_2!],
    },
    [soneium.id]: {
      chain: soneium,
      rpcUrls: [process.env.SONEIUM_RPC_URL_1!, process.env.SONEIUM_RPC_URL_2!],
    },
    [plumeMainnet.id]: {
      chain: plumeMainnet,
      rpcUrls: [process.env.PLUME_RPC_URL_1!, process.env.PLUME_RPC_URL_2!],
    },
    [tac.id]: {
      chain: tac,
      rpcUrls: [process.env.TAC_RPC_URL_1!, process.env.TAC_RPC_URL_2!],
    },
    [worldchain.id]: {
      chain: worldchain,
      rpcUrls: [process.env.WORLDCHAIN_RPC_URL_1!, process.env.WORLDCHAIN_RPC_URL_2!],
    },
    [corn.id]: {
      chain: corn,
      rpcUrls: [process.env.CORN_RPC_URL_1!, process.env.CORN_RPC_URL_2!],
    },
    [berachain.id]: {
      chain: berachain,
      rpcUrls: [process.env.BERACHAIN_RPC_URL_1!, process.env.BERACHAIN_RPC_URL_2!],
    },
  },
  maxRpcBatchSize: 32,

  supportedVaults: {
    [mainnet.id]: [
      { address: getAddress("0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB") }, // Steakhouse USDC
      { address: getAddress("0xbEef047a543E45807105E51A8BBEFCc5950fcfBa") }, // Steakhouse USDT
      { address: getAddress("0xBeEf11eCb698f4B5378685C05A210bdF71093521") }, // Steakhouse RUSD
    ],
    [base.id]: [
      { address: getAddress("0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A") }, // Spark USDC
      { address: getAddress("0xa0E430870c4604CcfC7B38Ca7845B1FF653D0ff1") }, // Moonwell Flagship ETH
      { address: getAddress("0x543257eF2161176D7C8cD90BA65C2d4CaEF5a796") }, // Moonwell Frontier cbBTC
    ],
    [polygon.id]: [
      { address: getAddress("0xF5C81d25ee174d83f1FD202cA94AE6070d073cCF") }, // Compound WETH
      { address: getAddress("0x781FB7F6d845E3bE129289833b04d43Aa8558c42") }, // Compound USDC
      { address: getAddress("0xfD06859A671C21497a2EB8C5E3fEA48De924D6c8") }, // Compound USDT
    ],
    [unichain.id]: [
      { address: getAddress("0xfA355999c12C63c465c591daf9C462e14ACf470b") }, // K3 Capital ETH Maxi
      { address: getAddress("0x38f4f3B6533de0023b9DCd04b02F93d36ad1F9f9") }, // Gauntlet USDC
      { address: getAddress("0x2c0F7e917257926BA6233B20DE19d7fe3210858C") }, // Re7 USDT0
    ],
    [katana.id]: [
      { address: getAddress("0xC5e7AB07030305fc925175b25B93b285d40dCdFf") }, // Gauntlet WETH
      { address: getAddress("0xE4248e2105508FcBad3fe95691551d1AF14015f7") }, // Gauntlet USDC
      { address: getAddress("0x5BD1D75d45EdB622d0ea50946F2f741CE8dC5b75") }, // Gauntlet BTCK
    ],
    [arbitrum.id]: [
      { address: getAddress("0x4B6F1C9E5d470b97181786b26da0d0945A7cf027") }, // Hyperithm USDC
      { address: getAddress("0x2281961480216653529A03D6CE03Ee6B8cdF564E") }, // Steakhouse Prime USDT0
    ],
    [hemi.id]: [
      { address: getAddress("0xA7dB73F80a173c31A1241Bf97F4452A07e443c6c") }, // Clearstar Reactor hemiBTC
    ],
    [lisk.id]: [
      { address: getAddress("0x8258F0c79465c95AFAc325D6aB18797C9DDAcf55") }, // Re7 LSK
      { address: getAddress("0x50cB55BE8cF05480a844642cB979820C847782aE") }, // Re7 USDT
      { address: getAddress("0x7Cbaa98bd5e171A658FdF761ED1Db33806a0d346") }, // Re7 WETH
    ],
    [soneium.id]: [
      { address: getAddress("0xEcDBE2AF33E68cf96F6716f706B078fa94e978cb") }, // Re7 USDC
    ],
    [plumeMainnet.id]: [
      { address: getAddress("0xc0Df5784f28046D11813356919B869dDA5815B16") }, // Re7 pUSD
      { address: getAddress("0xBB748a1346820560875CB7a9cD6B46c203230E07") }, // Mystic ETH
    ],
    [tac.id]: [
      { address: getAddress("0xC5e1bD2473811bB782326006A3c03477F7834D35") }, // Re7 WETH
      { address: getAddress("0x4183Bd253Dc1918A04Bd8a8dD546BaAD58898109") }, // Re7 USDT
    ],
    [worldchain.id]: [
      { address: getAddress("0x0db7e405278c2674f462ac9d9eb8b8346d1c1571") }, // WETH
      { address: getAddress("0x348831b46876d3df2db98bdec5e3b4083329ab9f") }, // WLD
      { address: getAddress("0xb1e80387ebe53ff75a89736097d34dc8d9e9045b") }, // USDC
    ],
    [corn.id]: [
      { address: getAddress("0xa7ba08cfc37e7cc67404d4996ffbb3e977490115") }, // Smokehouse WBTCN
      { address: getAddress("0x9b2fa89e23ae84f7895a58f8ec7cb0b267ed8a21") }, // Smokehouse USDT0
    ],
    [berachain.id]: [
      { address: getAddress("0x30BbA9CD9Eb8c95824aa42Faa1Bb397b07545bc1") }, // Re7 HONEY
    ],
  },

  actionParameters: {
    maxBorrowLtvMarginWad: parseUnits("0.05", 18), // 5% below LLTV
    publicAllocatorSupplyTargetUtilizationWad: BigInt(90_0000000000000000),
    bundler3Config: {
      enabled: false,
      slippageToleranceWad: parseUnits("0.0003", 18), // 0.03% slippage
    },
  },

  apyWindow: "7d",

  featureFlags: {
    enableDarkModeToggle: true,
    hideCurator: false,
  },

  analytics: {
    component: Analytics(),
    eventCb,
  },

  knownAddresses: {
    [getAddress("0xCC3E7c85Bb0EE4f09380e041fee95a0caeDD4a02")]: {
      name: "Compound DAO",
      iconUrl: "/compound.png",
    },
  },
};
