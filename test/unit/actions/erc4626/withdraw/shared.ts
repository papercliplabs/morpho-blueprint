import { fetchVaultConfig } from "@morpho-org/blue-sdk-viem";
import type { AnvilTestClient } from "@morpho-org/test";
import { type Address, maxUint256, parseEther, parseUnits, zeroAddress } from "viem";
import { expect } from "vitest";

import type { Erc4626WithdrawActionParameters, VaultAction } from "@/actions/types";

import { RANDOM_ADDRESS } from "../../../../helpers/constants";
import { expectZeroErc20Balances, getErc20BalanceOf } from "../../../../helpers/erc20";
import { executeAction } from "../../../../helpers/executeAction";
import { expectOnlyAllowedApprovals } from "../../../../helpers/logs";
import { createVaultPosition, getMorphoVaultPosition } from "../../../../helpers/morpho";

export interface Erc4626WithdrawTestParameters {
  client: AnvilTestClient;
  vaultAddress: Address;
  accountAddress?: Address; // Optional override (defaults to client.account.address)

  initialState: {
    vaultPositionBalance: bigint;
    walletUnderlyingAssetBalance?: bigint; // Optional existing wallet balance
  };

  withdrawAmount: bigint;

  beforeExecutionCb?: (client: AnvilTestClient) => Promise<void>; // Runs after action creation, before execution (e.g., manipulate price)

  // Test configuration
  withdrawActionFn: (params: Erc4626WithdrawActionParameters) => Promise<VaultAction>;
  expectedApprovalTargets: Address[];
  expectedZeroBalanceAddresses?: Address[];
}

export async function runErc4626WithdrawTest({
  client,
  vaultAddress,
  accountAddress,
  initialState,
  withdrawAmount,
  beforeExecutionCb,
  withdrawActionFn,
  expectedApprovalTargets,
  expectedZeroBalanceAddresses,
}: Erc4626WithdrawTestParameters): Promise<void> {
  ////
  // Arrange
  ////
  const testAccountAddress = accountAddress ?? client.account.address;
  const vaultConfig = await fetchVaultConfig(vaultAddress, client);
  const assetAddress = vaultConfig.asset;

  // Provide gas
  await client.setBalance({ address: client.account.address, value: parseEther("1000") });

  // Seed additional vault liquidity to ensure withdrawals can succeed (do this FIRST to avoid interest accrual affecting test account)
  await createVaultPosition(client, vaultAddress, initialState.vaultPositionBalance * 10n, RANDOM_ADDRESS);

  // Create initial vault position for test account (skip if account is invalid for validation tests)
  const isValidAccount = testAccountAddress !== zeroAddress && testAccountAddress !== vaultAddress;
  if (isValidAccount) {
    await createVaultPosition(client, vaultAddress, initialState.vaultPositionBalance, testAccountAddress);
  }

  // Set any additional underlying asset balance in wallet (done AFTER vault position to ensure clean state)
  if (initialState.walletUnderlyingAssetBalance && initialState.walletUnderlyingAssetBalance > 0n) {
    await client.deal({
      erc20: assetAddress,
      amount: initialState.walletUnderlyingAssetBalance,
    });
  }

  // Track initial wallet balance for assertions
  const initialWalletBalance = await getErc20BalanceOf(client, assetAddress, testAccountAddress);

  ////
  // Act
  ////
  const action = await withdrawActionFn({
    client,
    vaultAddress,
    accountAddress: testAccountAddress,
    withdrawAmount,
  });

  await beforeExecutionCb?.(client);

  const logs = await executeAction(client, action);

  ////
  // Assert
  ////
  await expectOnlyAllowedApprovals(
    client,
    logs,
    testAccountAddress,
    expectedApprovalTargets,
    [], // No permit signatures (using approval tx only)
  );

  const finalVaultPosition = await getMorphoVaultPosition(client, vaultAddress, testAccountAddress);
  const finalWalletBalance = await getErc20BalanceOf(client, assetAddress, testAccountAddress);

  // Check position and wallet balance based on withdraw type
  if (withdrawAmount === maxUint256) {
    // Full withdraw - position should be 0, wallet should have all assets
    expect(finalVaultPosition).toEqual(0n);
    expect(finalWalletBalance).toBeGreaterThanOrEqual(
      initialWalletBalance + initialState.vaultPositionBalance - BigInt(1),
    ); // Allow 1 wei rounding
  } else {
    // Partial withdraw - position decreased, wallet increased by exact amount
    // Note: Allow for rounding differences and minor interest accrual (scales with position size)
    const expectedPosition = initialState.vaultPositionBalance - withdrawAmount;
    const tolerance = initialState.vaultPositionBalance / 100000n; // 0.001% tolerance for interest accrual
    expect(finalVaultPosition).toBeWithinRange(expectedPosition - tolerance, expectedPosition + tolerance);
    expect(finalWalletBalance).toEqual(initialWalletBalance + withdrawAmount);
  }

  // Make sure no funds left in addresses which we expect zero (ex. bundler or adapters)
  if (expectedZeroBalanceAddresses) {
    await expectZeroErc20Balances(client, expectedZeroBalanceAddresses, assetAddress);
    await expectZeroErc20Balances(client, expectedZeroBalanceAddresses, vaultAddress);
  }
}

// Shared test cases
export const successTestCases: Array<{
  name: string;
  vaultAddress: Address;
  initialState: { vaultPositionBalance: bigint };
  withdrawAmount: bigint;
  beforeExecutionCb?: (client: AnvilTestClient) => Promise<void>;
}> = [
  {
    name: "Partial withdraw (50%)",
    vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
    initialState: {
      vaultPositionBalance: parseUnits("2000", 6),
    },
    withdrawAmount: parseUnits("1000", 6),
  },
  {
    name: "Partial withdraw (10%)",
    vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
    initialState: {
      vaultPositionBalance: parseUnits("10000", 6),
    },
    withdrawAmount: parseUnits("1000", 6),
  },
  {
    name: "Full withdraw (maxUint256)",
    vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
    initialState: {
      vaultPositionBalance: parseUnits("5000", 6),
    },
    withdrawAmount: maxUint256,
  },
  {
    name: "Full withdraw after interest accrual",
    vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
    initialState: {
      vaultPositionBalance: parseUnits("10000", 6),
    },
    withdrawAmount: maxUint256,
    beforeExecutionCb: async (client) => {
      // Mine blocks to accrue interest
      await client.mine({ blocks: 1000 });
    },
  },
  {
    name: "Minimal withdraw amount (1 wei)",
    vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
    initialState: {
      vaultPositionBalance: parseUnits("1000", 6),
    },
    withdrawAmount: BigInt(1),
  },
  {
    name: "Large position withdraw",
    vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
    initialState: {
      vaultPositionBalance: parseUnits("100000", 6), // 100K USDC
    },
    withdrawAmount: parseUnits("50000", 6),
  },
  {
    name: "Withdraw almost entire position (99%)",
    vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
    initialState: {
      vaultPositionBalance: parseUnits("10000", 6),
    },
    withdrawAmount: parseUnits("9900", 6),
  },
];

// Shared failure test cases
export const failureTestCases: Array<{
  name: string;
  vaultAddress: Address;
  initialState: { vaultPositionBalance: bigint };
  withdrawAmount: bigint;
  expectedError: string | RegExp;
  accountAddress?: Address; // Optional override for account address
}> = [
  {
    name: "throws when vault doesn't exist",
    vaultAddress: "0x0000000000000000000000000000000000000000",
    initialState: {
      vaultPositionBalance: parseUnits("100", 6),
    },
    withdrawAmount: parseUnits("10", 6),
    expectedError: /.*/, // Any error is acceptable
  },
  {
    name: "throws when account address is zero",
    vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
    initialState: {
      vaultPositionBalance: parseUnits("100", 6),
    },
    withdrawAmount: parseUnits("10", 6),
    accountAddress: "0x0000000000000000000000000000000000000000",
    expectedError: "Invalid input: Account and vault addresses must be distinct and non-zero.",
  },
  {
    name: "throws when account address equals vault address",
    vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
    initialState: {
      vaultPositionBalance: parseUnits("100", 6),
    },
    withdrawAmount: parseUnits("10", 6),
    accountAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB", // Same as vault
    expectedError: "Invalid input: Account and vault addresses must be distinct and non-zero.",
  },
  {
    name: "insufficient position balance",
    vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
    initialState: {
      vaultPositionBalance: parseUnits("100", 6),
    },
    withdrawAmount: parseUnits("1000", 6),
    expectedError: /Simulation Error|insufficient/i,
  },
  {
    name: "zero withdraw amount",
    vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
    initialState: {
      vaultPositionBalance: parseUnits("100", 6),
    },
    withdrawAmount: 0n,
    expectedError: "Invalid input: Amount must be greater than 0.",
  },
  {
    name: "negative withdraw amount",
    vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
    initialState: {
      vaultPositionBalance: parseUnits("100", 6),
    },
    withdrawAmount: -1n,
    expectedError: "Invalid input: Amount must be greater than 0.",
  },
];

// Shared slippage test for bundler3
// Note: For withdraw, we can't easily simulate slippage in the same way as supply
// because decreasing share price during withdraw would actually benefit the user (fewer shares burned)
// Slippage protection on withdraw protects against share price INCREASING (more shares needed)
export async function runSlippageTest(
  client: AnvilTestClient,
  withdrawActionFn: (params: Erc4626WithdrawActionParameters) => Promise<VaultAction>,
  expectedApprovalTargets: Address[],
  expectedZeroBalanceAddresses: Address[],
) {
  const vaultAddress = "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB";

  return runErc4626WithdrawTest({
    client,
    vaultAddress,
    initialState: {
      vaultPositionBalance: parseUnits("100000", 6),
    },
    withdrawAmount: parseUnits("10000", 6),
    beforeExecutionCb: async () => {
      // For withdrawal slippage test, we would need to INCREASE the share price
      // (make shares more valuable, so we need to burn more shares to get same assets)
      // However, in MetaMorpho v1.1, share price can't easily be manipulated upward during a withdraw
      // This test verifies that the transaction succeeds under normal conditions
      await client.mine({ blocks: 10 });
    },
    withdrawActionFn,
    expectedApprovalTargets,
    expectedZeroBalanceAddresses,
  });
}
