import { parseUnits } from "viem";
import { describe, expect } from "vitest";

import { erc4626WithdrawActionDirect } from "@/actions/erc4626/withdraw/erc4626WithdrawActionDirect";

import { test } from "../../../../config";
import { failureTestCases, runErc4626WithdrawTest, runSlippageTest, successTestCases } from "./shared";

describe("erc4626WithdrawActionDirect", () => {
  describe("happy path", () => {
    successTestCases.map((testCase) => {
      test(testCase.name, async ({ client }) => {
        await runErc4626WithdrawTest({
          client,
          ...testCase,
          withdrawActionFn: erc4626WithdrawActionDirect,
          expectedApprovalTargets: [], // Direct withdraw doesn't need any approvals (burning shares)
          // No need to check bundler/adapter balances for direct withdraw
        });
      });
    });

    test("withdraw with existing wallet balance", async ({ client }) => {
      const vaultAddress = "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB";

      // This test verifies that withdrawing works correctly even when the user
      // already has some underlying assets in their wallet
      await runErc4626WithdrawTest({
        client,
        vaultAddress,
        initialState: {
          vaultPositionBalance: parseUnits("1000", 6),
          walletUnderlyingAssetBalance: parseUnits("500", 6), // Already have some USDC in wallet
        },
        withdrawAmount: parseUnits("300", 6),
        withdrawActionFn: erc4626WithdrawActionDirect,
        expectedApprovalTargets: [],
      });
    });
  });

  describe("sad path", () => {
    failureTestCases.map((testCase) => {
      test(testCase.name, async ({ client }) => {
        await expect(
          runErc4626WithdrawTest({
            client,
            ...testCase,
            withdrawActionFn: erc4626WithdrawActionDirect,
            expectedApprovalTargets: [],
          }),
        ).rejects.toThrow(testCase.expectedError);
      });
    });
  });

  describe("slippage behavior", () => {
    test("succeeds under normal conditions (no slippage protection)", async ({ client }) => {
      // This test demonstrates that direct withdraw lacks slippage protection
      // It will succeed even under adverse price conditions
      await runSlippageTest(
        client,
        erc4626WithdrawActionDirect,
        [], // No approvals needed
        [], // No bundler/adapter to check
      );

      // Direct withdraw always succeeds as it has no slippage protection
    });
  });
});
