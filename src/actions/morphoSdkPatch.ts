/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChainId, NATIVE_ADDRESS, registerCustomAddresses } from "@morpho-org/blue-sdk";
import { getAddress } from "viem";

// Patch Morpho SDK for unsupported chains

declare module "@morpho-org/blue-sdk" {
  export enum ChainId {
    berachain = 80094,
    soneium = 1868,
  }
}

// Add new enum value
// biome-ignore lint/suspicious/noExplicitAny: Override type
(ChainId as any).berachain = 80094;
// biome-ignore lint/suspicious/noExplicitAny: Override type
(ChainId as any).soneium = 1868;

registerCustomAddresses({
  addresses: {
    [ChainId.berachain]: {
      morpho: getAddress("0x24147243f9c08d835C218Cda1e135f8dFD0517D0"),
      adaptiveCurveIrm: getAddress("0xcf247Df3A2322Dea0D408f011c194906E77a6f62"),
      metaMorphoFactory: getAddress("0x5EDd48C6ACBd565Eeb31702FD9fa9Cbc86fbE616"),
      publicAllocator: getAddress("0xB62F34Ab315eaDeAc698e8EaEB6Fc2650951BFe7"),
      bundler3: {
        bundler3: getAddress("0xF920140A65D0f412f2AB3e76C4fEAB5Eef0657ae"),
        generalAdapter1: getAddress("0xd2B9667F5214115E27937C410cAeE83E3a901Df7"),
      },
      wNative: getAddress("0x6969696969696969696969696969696969696969"),
    },
    [ChainId.soneium]: {
      morpho: getAddress("0xE75Fc5eA6e74B824954349Ca351eb4e671ADA53a"),
      adaptiveCurveIrm: getAddress("0x68F9b666b984527A7c145Db4103Cc6d3171C797F"),
      metaMorphoFactory: getAddress("0x7026b436f294e560b3C26E731f5cac5992cA2B33"),
      publicAllocator: getAddress("0x76f93A21573014Ab7d634D3204818922A234249e"),
      bundler3: {
        bundler3: getAddress("0x461378B79d400c963F48F57b3a99416bc3C5c6a6"),
        generalAdapter1: getAddress("0xA47EeDE3Aac741B830E394B2e291f6774BD8bb48"),
      },
      wNative: getAddress("0x4200000000000000000000000000000000000006"),
    },
  },
  unwrappedTokens: {
    [ChainId.berachain]: {
      [getAddress("0x6969696969696969696969696969696969696969")]: NATIVE_ADDRESS,
    },
    [ChainId.soneium]: {
      [getAddress("0x4200000000000000000000000000000000000006")]: NATIVE_ADDRESS,
    },
  },
});
