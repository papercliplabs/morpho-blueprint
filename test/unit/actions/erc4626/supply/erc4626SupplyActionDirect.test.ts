import { describe, expect } from "vitest";

import { erc4626SupplyActionDirect } from "@/actions/erc4626/supply/erc4626SupplyActionDirect";

import { test } from "../../../../config";
import {
  failureTestCases,
  runErc4626SupplyRevokeApprovalNotRequiredTest,
  runErc4626SupplyRevokeApprovalRequiredTest,
  runErc4626SupplySufficientAllowanceTest,
  runErc4626SupplyTest,
  runSlippageTest,
  successTestCases,
} from "./shared";

describe("erc4626SupplyActionDirect", () => {
  describe("happy path", () => {
    successTestCases.map((testCase) => {
      test(testCase.name, async ({ client }) => {
        await runErc4626SupplyTest({
          client,
          ...testCase,
          supplyActionFn: erc4626SupplyActionDirect,
          expectedApprovalTargets: [testCase.inputs.vaultAddress], // Direct supply only approves vault
          // No need to check bundler/adapter balances for direct supply
        });
      });
    });

    test("revokes approval for tokens requiring it (USDT) when existing allowance is insufficient", async ({
      client,
    }) => {
      await runErc4626SupplyRevokeApprovalRequiredTest(client, erc4626SupplyActionDirect, "vault");
    });

    test("does NOT revoke approval for tokens not requiring it (USDC) when existing allowance is insufficient", async ({
      client,
    }) => {
      await runErc4626SupplyRevokeApprovalNotRequiredTest(client, erc4626SupplyActionDirect, "vault");
    });

    test("skips approval entirely when sufficient allowance already exists", async ({ client }) => {
      await runErc4626SupplySufficientAllowanceTest(client, erc4626SupplyActionDirect, "vault");
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
            expectedApprovalTargets: [testCase.inputs.vaultAddress],
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

      // The transaction succeeded despite price manipulation, demonstrating the lack of slippage protection in direct supply
    });
  });
});
