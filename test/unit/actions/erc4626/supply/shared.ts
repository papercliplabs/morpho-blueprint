import { MathLib } from "@morpho-org/blue-sdk";
import { fetchVaultConfig, metaMorphoAbi } from "@morpho-org/blue-sdk-viem";
import type { AnvilTestClient } from "@morpho-org/test";
import { type Address, erc20Abi, getAddress, type Log, parseEther, parseUnits } from "viem";
import { readContract } from "viem/actions";
import { expect } from "vitest";

import type { Erc4626SupplyActionParameters, VaultAction } from "@/actions/types";

import { RANDOM_ADDRESS } from "../../../../helpers/constants";
import { expectZeroErc20Balances, expectZeroNativeAssetBalances, getErc20BalanceOf } from "../../../../helpers/erc20";
import { executeAction } from "../../../../helpers/executeAction";
import { expectOnlyAllowedApprovals, extractApprovalEvents } from "../../../../helpers/logs";
import { createVaultPosition, getMorphoVaultPosition, seedMarketLiquidity } from "../../../../helpers/morpho";

// Accounts for rounding and small interest accrual
const CHECK_TOLERANCE = 100n;

export interface Erc4626SupplyTestParameters {
  client: AnvilTestClient;
  vaultAddress: Address;
  accountAddress?: Address; // Optional override (defaults to client.account.address)

  initialState: {
    walletUnderlyingAssetBalance: bigint;
    vaultPositionBalance?: bigint; // Optional existing vault position
    walletNativeAssetBalance?: bigint; // Optional native asset balance (defaults to 1000 ETH for gas)
  };

  supplyAmount: bigint;
  allowNativeAssetWrapping?: boolean; // Optional, defaults to false

  beforeExecutionCb?: (client: AnvilTestClient) => Promise<void>; // Runs after action creation, before execution (e.g., manipulate price)

  // Test configuration
  supplyActionFn: (params: Erc4626SupplyActionParameters) => Promise<VaultAction>;
  expectedApprovalTargets: Address[];
  expectedZeroBalanceAddresses?: Address[];
}

export async function runErc4626SupplyTest({
  client,
  vaultAddress,
  accountAddress,
  initialState,
  supplyAmount,
  allowNativeAssetWrapping = false,
  beforeExecutionCb,
  supplyActionFn,
  expectedApprovalTargets,
  expectedZeroBalanceAddresses,
}: Erc4626SupplyTestParameters): Promise<Log[]> {
  ////
  // Arrange
  ////
  const testAccountAddress = accountAddress ?? client.account.address;
  const vaultConfig = await fetchVaultConfig(vaultAddress, client);
  const assetAddress = vaultConfig.asset;

  // Provide native balance for wrap tests
  await client.setBalance({
    address: client.account.address,
    value: initialState.walletNativeAssetBalance ?? parseEther("1000"),
  });

  // Set up existing vault position if specified (this calls deal internally)
  if (initialState.vaultPositionBalance && initialState.vaultPositionBalance > 0n) {
    await createVaultPosition(client, vaultAddress, initialState.vaultPositionBalance, testAccountAddress);
  }

  // Seed vault liquidity to avoid issues around 0 balances (this calls deal internally)
  await createVaultPosition(client, vaultAddress, initialState.walletUnderlyingAssetBalance * 4n, RANDOM_ADDRESS);

  // Now set the wallet balance for the actual supply (deal AFTER positions created)
  if (initialState.walletUnderlyingAssetBalance > 0n) {
    await client.deal({ erc20: assetAddress, amount: initialState.walletUnderlyingAssetBalance });
  }

  // Track initial native balance for wrap validation
  const initialNativeBalance = await client.getBalance({ address: testAccountAddress });

  ////
  // Act
  ////
  const action = await supplyActionFn({
    client,
    vaultAddress,
    accountAddress: testAccountAddress,
    supplyAmount,
    allowNativeAssetWrapping,
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

  const vaultPosition = await getMorphoVaultPosition(client, vaultAddress, testAccountAddress);
  const userWalletUnderlyingAssetBalance = await getErc20BalanceOf(client, assetAddress, testAccountAddress);
  const userWalletNativeAssetBalance = await client.getBalance({ address: testAccountAddress });

  const expectedPosition = (initialState.vaultPositionBalance ?? 0n) + supplyAmount;
  const expectedUserWalletUnderlyingBalance = MathLib.zeroFloorSub(
    initialState.walletUnderlyingAssetBalance,
    supplyAmount,
  );

  const shortfall = MathLib.zeroFloorSub(supplyAmount, initialState.walletUnderlyingAssetBalance);
  const expectedUserNativeBalance = initialNativeBalance - shortfall;

  // Allow small rounding difference due to rounding
  expect(vaultPosition).toBeWithinRange(expectedPosition - CHECK_TOLERANCE, expectedPosition + CHECK_TOLERANCE); // Always rounds against user
  expect(userWalletUnderlyingAssetBalance).toEqual(expectedUserWalletUnderlyingBalance); // Exact supply
  expect(userWalletNativeAssetBalance).toEqual(expectedUserNativeBalance); // Anvil spends no gas

  // Make sure no funds left in addresses which we expect zero (ex. bundler or adapters)
  if (expectedZeroBalanceAddresses) {
    await expectZeroErc20Balances(client, expectedZeroBalanceAddresses, assetAddress);
    await expectZeroErc20Balances(client, expectedZeroBalanceAddresses, vaultAddress);
    await expectZeroNativeAssetBalances(client, expectedZeroBalanceAddresses);
  }

  return logs;
}

// Shared test cases
export const successTestCases: Array<{
  name: string;
  vaultAddress: Address;
  initialState: {
    walletUnderlyingAssetBalance: bigint;
    vaultPositionBalance?: bigint;
    walletNativeAssetBalance?: bigint;
  };
  supplyAmount: bigint;
  allowNativeAssetWrapping?: boolean;
}> = [
  {
    name: "Partial supply ",
    vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("2000", 6),
    },
    supplyAmount: parseUnits("1000", 6),
  },
  {
    name: "Supply exact wallet balance",
    vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("1337", 6),
    },
    supplyAmount: parseUnits("1337", 6),
  },
  {
    name: "Supply with existing vault position",
    vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("500", 6),
      vaultPositionBalance: parseUnits("100", 6),
    },
    supplyAmount: parseUnits("500", 6),
  },
  {
    name: "Minimal supply amount (1 wei)",
    vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("1000", 6),
    },
    supplyAmount: BigInt(1),
  },
  {
    name: "Large supply amount",
    vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("1000000", 6), // 1M USDC
    },
    supplyAmount: parseUnits("1000000", 6),
  },
  {
    name: "Supply with partial native asset wrapping (WETH vault)",
    vaultAddress: "0x9a8bC3B04b7f3D87cfC09ba407dCED575f2d61D8", // MEV Capital WETH vault
    initialState: {
      walletUnderlyingAssetBalance: parseEther("1"), // 1 WETH
      walletNativeAssetBalance: parseEther("5"), // 5 ETH
    },
    supplyAmount: parseEther("3"), // Will wrap 2 ETH
    allowNativeAssetWrapping: true,
  },
  {
    name: "Supply with native asset wrapping only (WETH vault)",
    vaultAddress: "0x9a8bC3B04b7f3D87cfC09ba407dCED575f2d61D8", // MEV Capital WETH vault
    initialState: {
      walletUnderlyingAssetBalance: 0n, // 0 WETH
      walletNativeAssetBalance: parseEther("5"), // 5 ETH
    },
    supplyAmount: parseEther("2"), // Will wrap 2 ETH
    allowNativeAssetWrapping: true,
  },
  {
    name: "Supply with native asset wrapping near full amount (WETH vault)",
    vaultAddress: "0x9a8bC3B04b7f3D87cfC09ba407dCED575f2d61D8", // MEV Capital WETH vault
    initialState: {
      walletUnderlyingAssetBalance: parseEther("1"), // 0 WETH
      walletNativeAssetBalance: parseEther("5.01"), // 5 ETH + gas margin...
    },
    supplyAmount: parseEther("6"), // Fully consume WETH and ETH
    allowNativeAssetWrapping: true,
  },
  {
    name: "Supply with native asset wrapping enabled but no shortfall (WETH vault, full wrap)",
    vaultAddress: "0x9a8bC3B04b7f3D87cfC09ba407dCED575f2d61D8", // MEV Capital WETH vault
    initialState: {
      walletUnderlyingAssetBalance: parseEther("10"), // 1 WETH
      walletNativeAssetBalance: parseEther("5"), // 5 ETH
    },
    supplyAmount: parseEther("2"), // Doesn't need to wrap any
    allowNativeAssetWrapping: true,
  },
];

// Shared failure test cases
export const failureTestCases: Array<{
  name: string;
  vaultAddress: Address;
  initialState: {
    walletUnderlyingAssetBalance: bigint;
    walletNativeAssetBalance?: bigint;
  };
  supplyAmount: bigint;
  expectedError: string | RegExp;
  accountAddress?: Address; // Optional override for account address
  allowNativeAssetWrapping?: boolean;
}> = [
  {
    name: "throws when vault doesn't exist",
    vaultAddress: "0x0000000000000000000000000000000000000000",
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("100", 6),
    },
    supplyAmount: parseUnits("1000", 6),
    expectedError: /.*/, // Any error is acceptable
  },
  {
    name: "throws when account address is zero",
    vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("100", 6),
    },
    supplyAmount: parseUnits("100", 6),
    accountAddress: "0x0000000000000000000000000000000000000000",
    expectedError: "Invalid input: Account and vault addresses must be distinct and non-zero.",
  },
  {
    name: "throws when account address equals vault address",
    vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("100", 6),
    },
    supplyAmount: parseUnits("100", 6),
    accountAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB", // Same as vault
    expectedError: "Invalid input: Account and vault addresses must be distinct and non-zero.",
  },
  {
    name: "insufficient balance",
    vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("100", 6),
    },
    supplyAmount: parseUnits("1000", 6),
    expectedError: "Supply amount exceeds the account balance.",
  },
  {
    name: "zero supply amount",
    vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("100", 6),
    },
    supplyAmount: 0n,
    expectedError: "Invalid input: Amount must be greater than 0.",
  },
  {
    name: "negative supply amount",
    vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("100", 6),
    },
    supplyAmount: -1n,
    expectedError: "Invalid input: Amount must be greater than 0.",
  },
  {
    name: "insufficient total balance even with wrapping (WETH vault)",
    vaultAddress: "0x9a8bC3B04b7f3D87cfC09ba407dCED575f2d61D8", // MEV Capital WETH vault
    initialState: {
      walletUnderlyingAssetBalance: parseEther("1"), // 1 WETH
      walletNativeAssetBalance: parseEther("0.5"), // 0.5 ETH
    },
    supplyAmount: parseEther("2"), // 2 > 1 WETH + 0.5 ETH
    allowNativeAssetWrapping: true,
    expectedError: "Supply amount exceeds the account balance.",
  },
  {
    name: "wrapping disabled but user has sufficient native balance (WETH vault)",
    vaultAddress: "0x9a8bC3B04b7f3D87cfC09ba407dCED575f2d61D8", // MEV Capital WETH vault
    initialState: {
      walletUnderlyingAssetBalance: parseEther("1"), // 1 WETH
      walletNativeAssetBalance: parseEther("10"), // 10 ETH (plenty)
    },
    supplyAmount: parseEther("2"), // Trying to supply 2 WETH
    allowNativeAssetWrapping: false, // But wrapping is disabled
    expectedError: "Supply amount exceeds the account balance.",
  },
  {
    name: "wrapping on non-WETH vault doesn't allow action to be attempted",
    vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("100", 6), // 1000 USDC
      walletNativeAssetBalance: parseUnits("10000", 6), // 10000 USDC (plenty)
    },
    supplyAmount: parseUnits("1000", 6), // Don't have enough underlying assets
    allowNativeAssetWrapping: true, // Should have no effect
    expectedError: "Supply amount exceeds the account balance.",
  },
];

// Shared slippage test for bundler3
export async function runSlippageTest(
  client: AnvilTestClient,
  supplyActionFn: (params: Erc4626SupplyActionParameters) => Promise<VaultAction>,
  expectedApprovalTargets: Address[],
  expectedZeroBalanceAddresses: Address[],
) {
  const vaultAddress = "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB";

  const totalAssetsBefore = await readContract(client, {
    address: vaultAddress,
    abi: metaMorphoAbi,
    functionName: "totalAssets",
  });

  // Increase the share price by 0.05%, which is above the acceptable slippage tolerance
  const donationAmount = MathLib.mulDivUp(totalAssetsBefore, BigInt(0.0005 * Number(MathLib.WAD)), MathLib.WAD);

  await client.setBalance({ address: RANDOM_ADDRESS, value: parseEther("10") });

  return runErc4626SupplyTest({
    client,
    vaultAddress,
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("100000", 6),
    },
    supplyAmount: parseUnits("10000", 6),
    beforeExecutionCb: async () => {
      // Supply to a market on behalf of vault to manipulate (increasing) the share price (totalAssets / totalShares)
      // Note that vaults totalAssets is the sum over it's assets in each of the allocating markets
      // So, one way to manipulate the share price is a large "donation" to a market on behalf of the vault
      await seedMarketLiquidity(
        client,
        "0x64d65c9a2d91c36d56fbc42d69e979335320169b3df63bf92789e2c8883fcc64",
        donationAmount,
        vaultAddress,
      );
    },
    supplyActionFn,
    expectedApprovalTargets,
    expectedZeroBalanceAddresses,
  });
}

// Test that tokens requiring approval revocation (like USDT) properly revoke before re-approving
export async function runErc4626SupplyRevokeApprovalRequiredTest(
  client: AnvilTestClient,
  supplyActionFn: (params: Erc4626SupplyActionParameters) => Promise<VaultAction>,
  expectedSpender: "vault" | Address,
) {
  // USDT vault on mainnet - requires approval revocation
  const vaultAddress = "0x79FD640000F8563A866322483524a4b48f1Ed702"; // Gauntlet USDT vault
  const assetAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // USDT

  const expectedSpenderAddress = expectedSpender === "vault" ? vaultAddress : expectedSpender;

  // Create an existing insufficient approval (simulates existing allowance)
  await client.writeContract({
    address: assetAddress,
    abi: erc20Abi,
    functionName: "approve",
    args: [expectedSpenderAddress, parseUnits("500", 6)],
  });

  // Now run the supply test - it should handle the revoke + approve + deposit
  const logs = await runErc4626SupplyTest({
    client,
    vaultAddress,
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("2000", 6),
    },
    supplyAmount: parseUnits("1000", 6),
    supplyActionFn,
    expectedApprovalTargets: [expectedSpenderAddress],
  });

  const erc20Approvals = await extractApprovalEvents(logs, client.account.address);

  // Should have 2 approvals: revoke (0) + new approval
  expect(erc20Approvals).toHaveLength(2);

  if (erc20Approvals.length === 2) {
    const firstApproval = erc20Approvals[0]!;
    const secondApproval = erc20Approvals[1]!;

    // First approval revokes the existing allowance
    expect(getAddress(firstApproval.asset)).toBe(getAddress(assetAddress));
    expect(getAddress(firstApproval.spender)).toBe(getAddress(expectedSpenderAddress));
    expect(firstApproval.amount).toBe(0n);

    // Second approval sets the new allowance
    expect(getAddress(secondApproval.asset)).toBe(getAddress(assetAddress));
    expect(getAddress(secondApproval.spender)).toBe(getAddress(expectedSpenderAddress));
    expect(secondApproval.amount).toBe(parseUnits("1000", 6));
  }
}

// Test that tokens NOT requiring approval revocation (like USDC) skip the revoke step
export async function runErc4626SupplyRevokeApprovalNotRequiredTest(
  client: AnvilTestClient,
  supplyActionFn: (params: Erc4626SupplyActionParameters) => Promise<VaultAction>,
  expectedSpender: "vault" | Address,
) {
  // USDC vault on mainnet - does NOT require approval revocation
  const vaultAddress = "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB"; // Steakhouse USDC vault
  const assetAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC

  const expectedSpenderAddress = expectedSpender === "vault" ? vaultAddress : expectedSpender;

  // Create an existing insufficient approval (simulates existing allowance)
  await client.writeContract({
    address: assetAddress,
    abi: erc20Abi,
    functionName: "approve",
    args: [expectedSpenderAddress, parseUnits("500", 6)],
  });

  // Now run the supply test - it should only do approve + deposit (NO revoke)
  const logs = await runErc4626SupplyTest({
    client,
    vaultAddress,
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("2000", 6),
    },
    supplyAmount: parseUnits("1000", 6),
    supplyActionFn,
    expectedApprovalTargets: [expectedSpenderAddress],
  });

  const erc20Approvals = await extractApprovalEvents(logs, client.account.address);

  // Should have only 1 approval: new approval (no revoke!)
  expect(erc20Approvals).toHaveLength(1);
}

// Test that when sufficient allowance already exists, no approval transactions are created
export async function runErc4626SupplySufficientAllowanceTest(
  client: AnvilTestClient,
  supplyActionFn: (params: Erc4626SupplyActionParameters) => Promise<VaultAction>,
  expectedSpender: "vault" | Address,
) {
  // USDT vault on mainnet - using USDT to verify even tokens requiring revocation skip approvals when allowance is sufficient
  const vaultAddress = "0x79FD640000F8563A866322483524a4b48f1Ed702"; // Gauntlet USDT vault
  const assetAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // USDT

  const expectedSpenderAddress = expectedSpender === "vault" ? vaultAddress : expectedSpender;

  // Create an existing SUFFICIENT approval (more than supply amount)
  await client.writeContract({
    address: assetAddress,
    abi: erc20Abi,
    functionName: "approve",
    args: [expectedSpenderAddress, parseUnits("5000", 6)], // Much more than the 1000 we'll supply
  });

  // Now run the supply test - it should NOT create any approval transactions
  const logs = await runErc4626SupplyTest({
    client,
    vaultAddress,
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("2000", 6),
    },
    supplyAmount: parseUnits("1000", 6),
    supplyActionFn,
    expectedApprovalTargets: [expectedSpenderAddress],
  });

  const erc20Approvals = await extractApprovalEvents(logs, client.account.address);

  // Should have 0 approvals since sufficient allowance already exists
  expect(erc20Approvals).toHaveLength(0);
}
