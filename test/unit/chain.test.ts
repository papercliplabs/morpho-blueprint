import { getChainAddresses } from "@morpho-org/blue-sdk";
import { generalAdapter1Abi } from "@morpho-org/bundler-sdk-viem";
import { createPublicClient, http } from "viem";
import { getCode, readContract } from "viem/actions";
import { describe, expect, test } from "vitest";
import { merklDistributorAbi } from "@/actions/abis/merklDistributorAbi";
import { wrappedNativeAssetAbi } from "@/actions/abis/wrappedNativeAssetAbi";
import { MERKL_DISTRIBUTOR_ADDRESS } from "@/actions/constants";
import { APP_CONFIG, SUPPORTED_CHAIN_IDS } from "@/config";

import "@/actions/morphoSdkPatch";

describe("chain", async () => {
  for (const chainId of SUPPORTED_CHAIN_IDS) {
    describe(`id: ${chainId}`, () => {
      const chainConfig = APP_CONFIG.chainConfig[chainId];
      const client = createPublicClient({ chain: chainConfig.chain, transport: http(chainConfig.rpcUrls[0]) });

      for (const rpcUrl of chainConfig.rpcUrls) {
        test(`valid rpc with matching chain id: ${rpcUrl}`, async () => {
          const clientForRpc = createPublicClient({ chain: chainConfig.chain, transport: http(rpcUrl) });
          const chainId = await clientForRpc.getChainId();
          expect(chainId).toEqual(chainConfig.chain.id);
          expect(client.chain.id).toEqual(chainConfig.chain.id);
        });
      }

      test("valid merkl distributor contract", async () => {
        // Verify the distributor contract has the expected interface by calling a view function
        // This will throw if the contract doesn't exist or doesn't have the getMerkleRoot function
        await readContract(client, {
          address: MERKL_DISTRIBUTOR_ADDRESS,
          abi: merklDistributorAbi,
          functionName: "getMerkleRoot",
        });
      });

      test("valid morpho SDK addresses", async () => {
        // Will throw if the id is not even supported by the SDK
        const {
          wNative,
          bundler3: { bundler3, generalAdapter1 },
        } = getChainAddresses(chainConfig.chain.id);

        // Check wNative address is present, and contract has the name function
        expect(wNative).toBeDefined();
        await readContract(client, {
          address: wNative!,
          abi: wrappedNativeAssetAbi,
          functionName: "name",
        });

        // bundler3
        expect(bundler3).toBeDefined();
        const bundler3Code = await getCode(client, { address: bundler3! });
        expect(bundler3Code).toBeDefined();
        expect(bundler3Code).toMatch(/374f435d/); // multicall function selector

        // generalAdapter1 - should at least be a contract
        expect(generalAdapter1).toBeDefined();
        await readContract(client, {
          address: generalAdapter1!,
          abi: generalAdapter1Abi,
          functionName: "BUNDLER3",
        });
      });

      test("supports multicall3", async () => {
        const multicall3Address = chainConfig.chain.contracts?.multicall3?.address;
        expect(multicall3Address).toBeDefined();
      });
    });
  }
});
