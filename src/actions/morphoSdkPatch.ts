/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChainId, ChainUtils, NATIVE_ADDRESS, registerCustomAddresses } from "@morpho-org/blue-sdk";
import { getAddress } from "viem";

// Patch Morpho SDK for unsupported chains

declare module "@morpho-org/blue-sdk" {
  export enum ChainId {
    hyperevm = 999,
    lisk = 1135,
    berachain = 80094,
    soneium = 1868,
    hemi = 43111,
  }
}

// Add new enum value
// biome-ignore lint/suspicious/noExplicitAny: Override type
(ChainId as any).hyperevm = 999;
// biome-ignore lint/suspicious/noExplicitAny: Override type
(ChainId as any).lisk = 1135;
// biome-ignore lint/suspicious/noExplicitAny: Override type
(ChainId as any).berachain = 80094;
// biome-ignore lint/suspicious/noExplicitAny: Override type
(ChainId as any).soneium = 1868;
// biome-ignore lint/suspicious/noExplicitAny: Override type
(ChainId as any).hemi = 43111;

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
    [ChainId.hyperevm]: {
      morpho: getAddress("0x68e37dE8d93d3496ae143F2E900490f6280C57cD"),
      adaptiveCurveIrm: getAddress("0xD4a426F010986dCad727e8dd6eed44cA4A9b7483"),
      metaMorphoFactory: getAddress("0xec051b19d654C48c357dC974376DeB6272f24e53"),
      publicAllocator: getAddress("0x517505be22D9068687334e69ae7a02fC77edf4Fc"),
      bundler3: {
        bundler3: getAddress("0xa3F50477AfA601C771874260A3B34B40e244Fa0e"),
        generalAdapter1: getAddress("0xD7F48aDE56613E8605863832B7B8A1985B934aE4"),
      },
      wNative: getAddress("0x5555555555555555555555555555555555555555"),
    },
    [ChainId.lisk]: {
      morpho: getAddress("0x00cD58DEEbd7A2F1C55dAec715faF8aed5b27BF8"),
      adaptiveCurveIrm: getAddress("0x5576629f21D528A8c3e06C338dDa907B94563902"),
      metaMorphoFactory: getAddress("0x01dD876130690469F685a65C2B295A90a81BaD91"),
      publicAllocator: getAddress("0xb1E5B1De2a54ab55C412B5ee1E38e46799588103"),
      bundler3: {
        bundler3: getAddress("0xD96E5e02580C4EAfE15B5537b25eE3dEe5861e00"),
        generalAdapter1: getAddress("0x76cFE4BF840C7b461772fE7CDE399f58c4173584"),
      },
      wNative: getAddress("0x4200000000000000000000000000000000000006"),
    },
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
    [ChainId.hemi]: {
      morpho: getAddress("0xa4Ca2c2e25b97DA19879201bA49422bc6f181f42"),
      adaptiveCurveIrm: getAddress("0xdEbdEa31624552DF904A065221cD14088ABDeD70"),
      metaMorphoFactory: getAddress("0x8e52179BeB18E882040b01632440d8Ca0f01da82"),
      publicAllocator: getAddress("0x4107Ea1746909028d6212B315dE5fE9538F9eb39"),
      bundler3: {
        bundler3: getAddress("0x8eDa6E01a20E3Cd90B3B2AF6F790cB8FADEf3Ea8"),
        generalAdapter1: getAddress("0x9623090C3943ad63F7d794378273610Dd0deeFD4"),
      },
      wNative: getAddress("0x4200000000000000000000000000000000000006"),
    },
  },
  unwrappedTokens: {
    [ChainId.hyperevm]: {
      [getAddress("0x5555555555555555555555555555555555555555")]: NATIVE_ADDRESS,
    },
    [ChainId.lisk]: {
      [getAddress("0x4200000000000000000000000000000000000006")]: NATIVE_ADDRESS,
    },
    [ChainId.berachain]: {
      [getAddress("0x6969696969696969696969696969696969696969")]: NATIVE_ADDRESS,
    },
    [ChainId.soneium]: {
      [getAddress("0x4200000000000000000000000000000000000006")]: NATIVE_ADDRESS,
    },
    [ChainId.hemi]: {
      [getAddress("0x4200000000000000000000000000000000000006")]: NATIVE_ADDRESS,
    },
  },
});
