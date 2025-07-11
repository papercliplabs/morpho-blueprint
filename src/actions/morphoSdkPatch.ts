/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChainId, ChainUtils, NATIVE_ADDRESS, registerCustomAddresses } from "@morpho-org/blue-sdk";

// Patch Morpho SDK for unsupported chains

declare module "@morpho-org/blue-sdk" {
  export enum ChainId {
    lisk = 1135,
  }
}

// biome-ignore lint/suspicious/noExplicitAny: Allow overriding
(ChainId as any).lisk = 1135;

Object.assign(ChainUtils.CHAIN_METADATA, {
  [ChainId.lisk]: {
    name: "Lisk",
    id: ChainId.lisk,
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    explorerUrl: "https://blockscout.lisk.com",
    identifier: "lisk",
  },
});

registerCustomAddresses({
  addresses: {
    [ChainId.lisk]: {
      morpho: "0x00cD58DEEbd7A2F1C55dAec715faF8aed5b27BF8",
      adaptiveCurveIrm: "0x5576629f21D528A8c3e06C338dDa907B94563902",
      metaMorphoFactory: "0x01dD876130690469F685a65C2B295A90a81BaD91",
      publicAllocator: "0xb1E5B1De2a54ab55C412B5ee1E38e46799588103",
      bundler3: {
        bundler3: "0xD96E5e02580C4EAfE15B5537b25eE3dEe5861e00",
        generalAdapter1: "0x76cFE4BF840C7b461772fE7CDE399f58c4173584",
      },
      wNative: "0x4200000000000000000000000000000000000006",
    },
  },
  unwrappedTokens: {
    [ChainId.lisk]: {
      "0x4200000000000000000000000000000000000006": NATIVE_ADDRESS,
    },
  },
});
