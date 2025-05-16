import { ChainId, getChainAddresses } from "@morpho-org/blue-sdk";
import { BundlerCall, bundler3Abi } from "@morpho-org/bundler-sdk-viem";
import { encodeFunctionData } from "viem";

export function encodeBundlerCalls(chainId: ChainId, calls: BundlerCall[]) {
  const {
    bundler3: { bundler3 },
  } = getChainAddresses(chainId);

  const value = calls.reduce((acc, call) => acc + call.value, 0n);
  return {
    to: bundler3,
    value,
    data: encodeFunctionData({
      abi: bundler3Abi,
      functionName: "multicall",
      args: [calls],
    }),
  };
}
