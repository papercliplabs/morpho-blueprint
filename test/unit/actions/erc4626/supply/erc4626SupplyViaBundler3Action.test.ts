import { getChainAddresses } from "@morpho-org/blue-sdk";
import { describe, expect } from "vitest";

import { erc4626SupplyViaBundler3Action } from "@/actions/erc4626/supply/erc4626SupplyViaBundler3Action";

import { test } from "../../../../config";
import {
  failureTestCases,
  runErc4626SupplyRevokeApprovalTest,
  runErc4626SupplyTest,
  runSlippageTest,
  successTestCases,
} from "./shared";

describe("erc4626SupplyViaBundler3Action", () => {
  describe("happy path", () => {
    successTestCases.map((testCase) => {
      test(testCase.name, async ({ client }) => {
        const {
          bundler3: { bundler3, generalAdapter1 },
        } = getChainAddresses(client.chain.id);

        await runErc4626SupplyTest({
          client,
          ...testCase,
          supplyActionFn: erc4626SupplyViaBundler3Action,
          expectedApprovalTargets: [generalAdapter1], // Only approves GA1 (using approval tx, not permit2)
          expectedZeroBalanceAddresses: [bundler3, generalAdapter1], // Check bundler/adapter have no leftover funds
        });
      });
    });

    test("handles existing non-zero allowance with revoke before approve", async ({ client }) => {
      const {
        bundler3: { generalAdapter1 },
      } = getChainAddresses(client.chain.id);
      await runErc4626SupplyRevokeApprovalTest(client, erc4626SupplyViaBundler3Action, generalAdapter1);
    });
  });

  describe("sad path", () => {
    failureTestCases.map((testCase) => {
      test(testCase.name, async ({ client }) => {
        const {
          bundler3: { bundler3, generalAdapter1 },
        } = getChainAddresses(client.chain.id);

        await expect(
          runErc4626SupplyTest({
            client,
            ...testCase,
            supplyActionFn: erc4626SupplyViaBundler3Action,
            expectedApprovalTargets: [generalAdapter1],
            expectedZeroBalanceAddresses: [bundler3, generalAdapter1],
          }),
        ).rejects.toThrow(testCase.expectedError);
      });
    });

    test("tx should revert if slippage tolerance is exceeded", async ({ client }) => {
      const {
        bundler3: { bundler3, generalAdapter1 },
      } = getChainAddresses(client.chain.id);

      await expect(
        runSlippageTest(client, erc4626SupplyViaBundler3Action, [generalAdapter1], [bundler3, generalAdapter1]),
      ).rejects.toThrow("action-tx-reverted");
    });
  });
});
