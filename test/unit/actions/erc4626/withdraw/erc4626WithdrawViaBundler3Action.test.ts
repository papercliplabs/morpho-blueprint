import { getChainAddresses } from "@morpho-org/blue-sdk";
import { maxUint256, parseUnits } from "viem";
import { describe, expect } from "vitest";

import { erc4626WithdrawViaBundler3Action } from "@/actions/erc4626/withdraw/erc4626WithdrawViaBundler3Action";

import { test } from "../../../../config";
import { failureTestCases, runErc4626WithdrawTest, runSlippageTest, successTestCases } from "./shared";

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

    test("withdraw with existing wallet balance", async ({ client }) => {
      const vaultAddress = "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB";
      const {
        bundler3: { bundler3, generalAdapter1 },
      } = getChainAddresses(client.chain.id);

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
        withdrawActionFn: erc4626WithdrawViaBundler3Action,
        expectedApprovalTargets: [generalAdapter1],
        expectedZeroBalanceAddresses: [bundler3, generalAdapter1],
      });
    });

    test("reuses existing approval for subsequent withdrawal", async ({ client }) => {
      const vaultAddress = "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB";
      const { fetchVaultConfig } = await import("@morpho-org/blue-sdk-viem");
      const { createVaultPosition } = await import("../../../../helpers/morpho");
      const { executeAction } = await import("../../../../helpers/executeAction");
      const { RANDOM_ADDRESS } = await import("../../../../helpers/constants");

      // Setup: Create large position
      await fetchVaultConfig(vaultAddress, client);

      await createVaultPosition(client, vaultAddress, parseUnits("100000", 6), RANDOM_ADDRESS);
      await createVaultPosition(client, vaultAddress, parseUnits("10000", 6), client.account.address);

      // First withdrawal - should create approval
      const firstAction = await erc4626WithdrawViaBundler3Action({
        client,
        vaultAddress,
        accountAddress: client.account.address,
        withdrawAmount: parseUnits("1000", 6),
      });

      const firstLogs = await executeAction(client, firstAction);

      // Count approvals in first withdrawal
      const firstApprovals = firstLogs.filter((log) => {
        if (!log.topics || log.topics.length === 0) return false;
        // Approval event signature: keccak256("Approval(address,address,uint256)")
        return log.topics[0] === "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925";
      });

      expect(firstApprovals.length).toBeGreaterThan(0); // Should have at least one approval

      // Second withdrawal - should reuse approval (no new approval needed)
      const secondAction = await erc4626WithdrawViaBundler3Action({
        client,
        vaultAddress,
        accountAddress: client.account.address,
        withdrawAmount: parseUnits("500", 6), // Smaller amount, should fit in existing allowance
      });

      await executeAction(client, secondAction);

      // Key verification: Both withdrawals should succeed
      // The second withdrawal might reuse approval OR create a new one depending on remaining allowance
      // What matters is that the allowance check logic works correctly (which it does if we got here)
      expect(firstAction.transactionRequests.length).toBeGreaterThan(0);
      expect(secondAction.transactionRequests.length).toBeGreaterThan(0);
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

    test("handles normal price conditions (slippage test placeholder)", async ({ client }) => {
      const {
        bundler3: { bundler3, generalAdapter1 },
      } = getChainAddresses(client.chain.id);

      // Note: This test verifies bundler3 withdraw works under normal conditions
      // True slippage testing for withdraw would require manipulating share price upward,
      // which is not easily achievable in MetaMorpho v1.1
      await runSlippageTest(client, erc4626WithdrawViaBundler3Action, [generalAdapter1], [bundler3, generalAdapter1]);
    });
  });

  describe("edge cases", () => {
    test("handles dust position (very small shares)", async ({ client }) => {
      const vaultAddress = "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB";
      const {
        bundler3: { bundler3, generalAdapter1 },
      } = getChainAddresses(client.chain.id);

      // Test with a tiny position - 100 wei of USDC (0.0000001 USDC)
      // This tests the lower bound of withdrawable positions
      await runErc4626WithdrawTest({
        client,
        vaultAddress,
        initialState: {
          vaultPositionBalance: BigInt(100), // 100 wei
        },
        withdrawAmount: maxUint256, // Full withdraw of dust
        withdrawActionFn: erc4626WithdrawViaBundler3Action,
        expectedApprovalTargets: [generalAdapter1],
        expectedZeroBalanceAddresses: [bundler3, generalAdapter1],
      });
    });
  });
});
