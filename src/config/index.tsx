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
  [polygon.id]: [
    getAddress("0x781FB7F6d845E3bE129289833b04d43Aa8558c42"), // USDC
    getAddress("0xF5C81d25ee174d83f1FD202cA94AE6070d073cCF"), // WETH
    getAddress("0xfD06859A671C21497a2EB8C5E3fEA48De924D6c8"), // USDT
    getAddress("0x3F33F9f7e2D7cfBCBDf8ea8b870a6E3d449664c2"), // POL
  ],
};

// ChainId -> MarketId
export const WHITELISTED_MARKETS: Record<number, Hex[]> = {
  // [mainnet.id]: ["0x3a85e619751152991742810df6ec69ce473daef99e28a64ab2340d7b7ccfee49"],
  [base.id]: ["0x8793cf302b8ffd655ab97bd1c695dbd967807e8367a65cb2f4edaf1380ba1bda"],
  [polygon.id]: [
    "0xa5b7ae7654d5041c28cb621ee93397394c7aee6c6e16c7e0fd030128d87ee1a3",
    "0xfacd2aaa4ba788e9161c4572a44ce7bbe0944768fac271859d9034f2422e606c", // USDC idle
    "0x1cfe584af3db05c7f39d60e458a87a8b2f6b5d8c6125631984ec489f1d13553b", // WBTC/USDC - 86%
    "0x1947267c49c3629c5ed59c88c411e8cf28c4d2afdb5da046dc8e3846a4761794", // MATICx/USDC - 77%
    "0xa5b7ae7654d5041c28cb621ee93397394c7aee6c6e16c7e0fd030128d87ee1a3", // WETH/USDC - 86%
    "0x7506b33817b57f686e37b87b5d4c5c93fdef4cffd21bbf9291f18b2f29ab0550", // POL/USDC - 77%
    "0xd1485762dd5256b99530b6b07ab9d20c8d31b605dd5f27ad0c6dec2a18179ac6", // compWETH/USDC - 86%
    "0x8513df298cab92cafba1bae394420b7150aa40a5fac649c7168404bd5174a54c", // sACRED/USDC - 77%

    "0x372f25501f88e5e8b9373b8076985870b7c1cbd0903f26a1fef34790dbdb3607", // USDT idle
    "0x2476bb905e3d94acd7b402b3d70d411eeb6ace82afd3007da69a0d5904dfc998", // WBTC/USDT - 86%
    "0x41e537c46cc0e2f82aa69107cd72573f585602d8c33c9b440e08eaba5e8fded1", // MATICx/USDC - 77%
    "0x01550b8779f4ca978fc16591537f3852c02c3491f597db93d9bb299dcbf5ddbe", // WETH/USDT - 86%
    "0x267f344f5af0d85e95f253a2f250985a9fb9fca34a3342299e20c83b6906fc80", // POL/USDT - 77%
    "0xa8c2e5b31d1f3fb6c000bd49355d091f71e7c866fcb74a1cb2562ef67157bc2a", // compWETH/USDT - 86%
  ],
};

// Target utilization above which the public allocator shared liquidity algorithm is enabled for borrowing (WAD)
export const PUBLIC_ALLOCATOR_SUPPLY_TARGET_UTILIZATION = BigInt(90_0000000000000000);

// [0, 1], Only allow a max borrow origination of up to this % below LLTV
export const MAX_BORROW_LTV_MARGIN = 0.05;

// Used to display a name and icon for addresses instead of the raw address in the UI
export const KNOWN_ADDRESSES: Record<Address, { name: string; iconSrc?: string } | undefined> = {
  [getAddress("0x9E33faAE38ff641094fa68c65c2cE600b3410585")]: {
    name: "Gauntlet",
    iconSrc: "/identity/gauntlet.png",
  },
  [getAddress("0xCC3E7c85Bb0EE4f09380e041fee95a0caeDD4a02")]: {
    name: "Compound DAO",
    iconSrc: "/identity/compound.png",
  },
};

// Controls the visibility of any dark mode toggles
export const ENABLE_DARK_MODE_TOGGLE = true;
