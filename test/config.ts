import { createViemTest } from "@morpho-org/test/vitest";
import { mainnet } from "viem/chains";

export const test = createViemTest(mainnet, {
  forkUrl: process.env.NEXT_PUBLIC_MAINNET_RPC_URL_1!,
  forkBlockNumber: 22618980,
});
