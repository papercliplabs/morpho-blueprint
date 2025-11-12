import { describe, expect } from "vitest";

import { erc4626WithdrawActionDirect } from "@/actions/erc4626/withdraw/erc4626WithdrawActionDirect";

import { test } from "../../../../config";
import { failureTestCases, runErc4626WithdrawTest, successTestCases } from "./shared";

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
});
