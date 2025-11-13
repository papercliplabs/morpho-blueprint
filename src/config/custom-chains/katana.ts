import { type Chain, getAddress } from "viem";
import { katana as katanaViemChain } from "viem/chains";

const katana = {
  ...katanaViemChain,
  contracts: {
    ...katanaViemChain.contracts,

    // This is missing from the viem chain config right now
    multicall3: {
      address: getAddress("0xcA11bde05977b3631167028862bE2a173976CA11"),
      blockCreated: 0,
    },
  },
} satisfies Chain;

export { katana };
