import { erc20Abi, parseUnits } from "viem";
import { describe, expect } from "vitest";

import { erc4626SupplyActionDirect } from "@/actions/erc4626/supply/erc4626SupplyActionDirect";

import { test } from "../../../../config";
import { failureTestCases, runErc4626SupplyTest, runSlippageTest, successTestCases } from "./shared";

describe("erc4626SupplyActionDirect", () => {
  describe("happy path", () => {
    successTestCases.map((testCase) => {
      test(testCase.name, async ({ client }) => {
        await runErc4626SupplyTest({
          client,
          ...testCase,
          supplyActionFn: erc4626SupplyActionDirect,
          expectedApprovalTargets: [testCase.vaultAddress], // Direct supply only approves vault
          // No need to check bundler/adapter balances for direct supply
        });
      });
    });

    // Test approval revoke for existing non-zero allowances (USDT case)
    test("handles existing non-zero allowance with revoke before approve", async ({ client }) => {
      const vaultAddress = "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB";

      // Set up initial state with wallet balance
      const assetAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC
      await client.deal({
        erc20: assetAddress,
        amount: parseUnits("2000", 6),
      });

      // Create an existing insufficient approval (simulates USDT case)
      await client.writeContract({
        address: assetAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [vaultAddress, parseUnits("500", 6)],
      });

      // Now run the supply test - it should handle the revoke + approve + deposit
      await runErc4626SupplyTest({
        client,
        vaultAddress,
        initialState: {
          walletUnderlyingAssetBalance: parseUnits("2000", 6),
        },
        supplyAmount: parseUnits("1000", 6),
        supplyActionFn: erc4626SupplyActionDirect,
        expectedApprovalTargets: [vaultAddress],
      });
    });
  });

  describe("sad path", () => {
    failureTestCases.map((testCase) => {
      test(testCase.name, async ({ client }) => {
        await expect(
          runErc4626SupplyTest({
            client,
            ...testCase,
            supplyActionFn: erc4626SupplyActionDirect,
            expectedApprovalTargets: [testCase.vaultAddress],
          }),
        ).rejects.toThrow(testCase.expectedError);
      });
    });
  });

  describe("slippage behavior", () => {
    test("succeeds even when share price is manipulated (no slippage protection)", async ({ client }) => {
      // This test demonstrates that direct supply lacks slippage protection
      // The same scenario that causes bundler3 to revert will succeed here
      await runSlippageTest(
        client,
        erc4626SupplyActionDirect,
        ["0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB"], // Vault address as approval target
        [], // No bundler/adapter to check
      );

      // If we reach here, the transaction succeeded despite price manipulation
      // This demonstrates the lack of slippage protection in direct supply
    });
  });
});
