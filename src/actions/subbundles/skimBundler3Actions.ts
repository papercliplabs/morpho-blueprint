import type { Action } from "@morpho-org/bundler-sdk-viem";
import { type Address, maxUint256 } from "viem";

interface SkimActionsParameters {
  readonly adapterAddress: Address;
  readonly erc20TokenAddresses: Address[];
  readonly accountAddress: Address;
}

// Bundler3 actions to skim all specified erc20 tokens and native assets from the adapterAddress to the accountAddress
export function skimBundler3Actions({
  adapterAddress,
  erc20TokenAddresses,
  accountAddress,
}: SkimActionsParameters): Action[] {
  const sweeps: Action[] = [
    {
      type: "nativeTransfer",
      args: [adapterAddress, accountAddress, maxUint256],
    },
  ];

  const uniqueTokenAddresses = Array.from(new Set(erc20TokenAddresses));

  for (const tokenAddress of uniqueTokenAddresses) {
    sweeps.push({
      type: "erc20Transfer",
      args: [tokenAddress, accountAddress, maxUint256, adapterAddress],
    });
  }

  return sweeps;
}
