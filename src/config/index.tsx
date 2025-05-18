import { AppKitNetwork } from "@reown/appkit/networks";
import { Address, Hex, getAddress } from "viem";
import { base, mainnet, polygon } from "viem/chains";

export const NETWORK_CONFIGS: { network: AppKitNetwork; rpcUrls: string[] }[] = [
  {
    network: mainnet,
    rpcUrls: ["TODO"],
  },
  {
    network: polygon,
    rpcUrls: [],
  },
  {
    network: base,
    rpcUrls: [],
  },
];

export const LINKS = {
  termsOfService: "TODO",
  privacyPolicy: "TODO",
  support: "TODO",
};

export const METADATA = {
  appName: "",
  appDescription: "",
  appIcon: "",
};

// ChainId -> Addresses
export const WHITELISTED_VAULTS: Record<number, Address[]> = {
  [mainnet.id]: [getAddress("0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB")],
  [base.id]: [getAddress("0x616a4E1db48e22028f6bbf20444Cd3b8e3273738")],
};

// ChainId -> MarketId
export const WHITELISTED_MARKETS: Record<number, Hex[]> = {
  // [mainnet.id]: ["0x3a85e619751152991742810df6ec69ce473daef99e28a64ab2340d7b7ccfee49"],
  [base.id]: ["0x8793cf302b8ffd655ab97bd1c695dbd967807e8367a65cb2f4edaf1380ba1bda"],
  [polygon.id]: ["0xa5b7ae7654d5041c28cb621ee93397394c7aee6c6e16c7e0fd030128d87ee1a3"],
};

// Target utilization above which the public allocator shared liquidity algorithm is enabled for borrowing (WAD)
export const PUBLIC_ALLOCATOR_SUPPLY_TARGET_UTILIZATION = BigInt(90_0000000000000000);

// [0, 1], Only allow a max borrow origination of up to this % below LLTV
export const MAX_BORROW_LTV_MARGIN = 0.05;
