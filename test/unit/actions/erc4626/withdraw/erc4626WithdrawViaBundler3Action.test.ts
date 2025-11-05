import { getChainAddresses } from "@morpho-org/blue-sdk";
import { metaMorphoAbi } from "@morpho-org/blue-sdk-viem";
import { parseUnits } from "viem";
import { describe, expect } from "vitest";
import { erc4626WithdrawViaBundler3Action } from "@/actions/erc4626/withdraw/erc4626WithdrawViaBundler3Action";
import { test } from "../../../../config";
import { extractApprovalEvents } from "../../../../helpers/logs";
import { failureTestCases, runErc4626WithdrawTest, successTestCases } from "./shared";

describe("erc4626WithdrawViaBundler3Action", () => {
  describe("happy path", () => {
    successTestCases.map((testCase) => {
      test(testCase.name, async ({ client }) => {
        const {
          bundler3: { bundler3, generalAdapter1 },
        } = getChainAddresses(client.chain.id);

        await runErc4626WithdrawTest({
          client,
          ...testCase,
          withdrawActionFn: erc4626WithdrawViaBundler3Action,
          expectedApprovalTargets: [generalAdapter1], // Only approves GA1 (using approval tx, not permit2)
          expectedZeroBalanceAddresses: [bundler3, generalAdapter1], // Check bundler/adapter have no leftover funds
        });
      });
    });

    test("skips approval if it already has enough allowance", async ({ client }) => {
      const vaultAddress = "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB";

      const {
        bundler3: { bundler3, generalAdapter1 },
      } = getChainAddresses(client.chain.id);

      // Create an existing approval (simulates existing allowance)
      await client.writeContract({
        address: vaultAddress,
        abi: metaMorphoAbi,
        functionName: "approve",
        args: [generalAdapter1, parseUnits("5000", 6)],
      });

      const logs = await runErc4626WithdrawTest({
        client,
        vaultAddress,
        initialState: {
          vaultPositionBalance: parseUnits("10000", 6),
        },
        accountAddress: client.account.address,
        withdrawAmount: parseUnits("1000", 6),
        withdrawActionFn: erc4626WithdrawViaBundler3Action,
        expectedApprovalTargets: [generalAdapter1],
        expectedZeroBalanceAddresses: [bundler3, generalAdapter1],
      });

      const approvals = await extractApprovalEvents(logs, client.account.address);

      expect(approvals.length).toBeGreaterThan(0); // Should have at least one approval
    });
  });

  describe("sad path", () => {
    failureTestCases.map((testCase) => {
      test(testCase.name, async ({ client }) => {
        const {
          bundler3: { bundler3, generalAdapter1 },
        } = getChainAddresses(client.chain.id);

        await expect(
          runErc4626WithdrawTest({
            client,
            ...testCase,
            withdrawActionFn: erc4626WithdrawViaBundler3Action,
            expectedApprovalTargets: [generalAdapter1],
            expectedZeroBalanceAddresses: [bundler3, generalAdapter1],
          }),
        ).rejects.toThrow(testCase.expectedError);
      });
    });
  });
});
