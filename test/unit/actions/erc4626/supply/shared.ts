import { getChainAddresses, MathLib } from "@morpho-org/blue-sdk";
import { fetchVaultConfig, metaMorphoAbi } from "@morpho-org/blue-sdk-viem";
import type { AnvilTestClient } from "@morpho-org/test";
import { type Address, erc20Abi, getAddress, type Log, maxUint256, parseEther, parseUnits, zeroAddress } from "viem";
import { readContract, writeContract } from "viem/actions";
import { expect } from "vitest";

import type { Erc4626SupplyActionParameters, VaultAction } from "@/actions/types";

import { RANDOM_ADDRESS } from "../../../../helpers/constants";
import { expectZeroErc20Balances, expectZeroNativeAssetBalances } from "../../../../helpers/erc20";
import { executeAction } from "../../../../helpers/executeAction";
import { expectOnlyAllowedApprovals, extractApprovalEvents } from "../../../../helpers/logs";
import {
  createVaultPosition,
  getVaultPositionAccountingSnapshot,
  seedMarketLiquidity,
} from "../../../../helpers/morpho";

export interface Erc4626SupplyTestParameters {
  client: AnvilTestClient;

  initialState: {
    walletUnderlyingAssetBalance: bigint;
    vaultPositionBalance?: bigint; // Optional existing vault position
    walletNativeAssetBalance?: bigint; // Optional native asset balance (defaults to 1000 ETH for gas)
  };

  inputs: Omit<Erc4626SupplyActionParameters, "client" | "accountAddress"> & { accountAddress?: Address };

  beforeExecutionCb?: (client: AnvilTestClient) => Promise<void>; // Runs after action creation, before execution (e.g., manipulate price)

  // Test configuration
  supplyActionFn: (params: Erc4626SupplyActionParameters) => Promise<VaultAction>;
  expectedApprovalTargets: Address[];
  expectedZeroBalanceAddresses?: Address[];
}

export async function runErc4626SupplyTest({
  client,
  initialState,
  inputs: { vaultAddress, accountAddress = client.account.address, supplyAmount, allowNativeAssetWrapping = false },
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

  ////
  // Act
  ////
  const beforeBuildSnapshot = await getVaultPositionAccountingSnapshot(client, vaultAddress, testAccountAddress);

  const action = await supplyActionFn({
    client,
    vaultAddress,
    accountAddress: testAccountAddress,
    supplyAmount,
    allowNativeAssetWrapping,
  });

  await beforeExecutionCb?.(client);

  const beforeExecutionSnapshot = await getVaultPositionAccountingSnapshot(client, vaultAddress, testAccountAddress);

  const logs = await executeAction(client, action);

  const afterExecutionSnapshot = await getVaultPositionAccountingSnapshot(client, vaultAddress, testAccountAddress);

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

  // Breakdown of underlying and native is fully specified at action build time
  const expectedWalletUnderlyingAssetsSupplied = MathLib.min(
    supplyAmount,
    beforeBuildSnapshot.walletUnderlyingAssetBalance,
  );
  const expectedWalletNativeAssetsSupplied = MathLib.zeroFloorSub(supplyAmount, expectedWalletUnderlyingAssetsSupplied);

  const expectedWalletUnderlyingBalance =
    beforeExecutionSnapshot.walletUnderlyingAssetBalance - expectedWalletUnderlyingAssetsSupplied;
  const expectedWalletNativeBalance =
    beforeExecutionSnapshot.walletNativeAssetBalance - expectedWalletNativeAssetsSupplied;

  const expectedPositionAssets = beforeExecutionSnapshot.positionAssets + supplyAmount;

  expect(afterExecutionSnapshot.walletUnderlyingAssetBalance).toBeGreaterThanOrEqual(
    expectedWalletUnderlyingBalance - 1n,
  );
  expect(afterExecutionSnapshot.walletNativeAssetBalance).toBeGreaterThanOrEqual(expectedWalletNativeBalance - 1n);
  expect(afterExecutionSnapshot.positionAssets).toBeGreaterThanOrEqual(expectedPositionAssets - 1n);

  // Make sure no funds left in addresses which we expect zero (ex. bundler or adapters)
  if (expectedZeroBalanceAddresses) {
    await expectZeroErc20Balances(client, expectedZeroBalanceAddresses, assetAddress);
    await expectZeroErc20Balances(client, expectedZeroBalanceAddresses, vaultAddress);
    await expectZeroNativeAssetBalances(client, expectedZeroBalanceAddresses);
  }

  return logs;
}

// Shared test cases
export const successTestCases: Array<
  {
    name: string;
  } & Omit<
    Erc4626SupplyTestParameters,
    "client" | "supplyActionFn" | "expectedApprovalTargets" | "expectedZeroBalanceAddresses"
  >
> = [
  {
    name: "Partial supply ",
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("2000", 6),
    },
    inputs: {
      vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      supplyAmount: parseUnits("1000", 6),
      allowNativeAssetWrapping: false,
    },
  },
  {
    name: "Supply exact wallet balance",
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("1337", 6),
    },
    inputs: {
      vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      supplyAmount: parseUnits("1337", 6),
      allowNativeAssetWrapping: false,
    },
  },
  {
    name: "Supply with existing vault position",
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("500", 6),
      vaultPositionBalance: parseUnits("100", 6),
    },
    inputs: {
      vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      supplyAmount: parseUnits("500", 6),
      allowNativeAssetWrapping: false,
    },
  },
  {
    name: "Minimal supply amount (1 wei)",
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("1000", 6),
    },
    inputs: {
      vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      supplyAmount: BigInt(1),
      allowNativeAssetWrapping: false,
    },
  },
  {
    name: "Large supply amount",
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("1000000", 6), // 1M USDC
    },
    inputs: {
      vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      supplyAmount: parseUnits("1000000", 6),
      allowNativeAssetWrapping: false,
    },
  },
  {
    name: "Supply with partial native asset wrapping (WETH vault)",
    initialState: {
      walletUnderlyingAssetBalance: parseEther("1"), // 1 WETH
      walletNativeAssetBalance: parseEther("5"), // 5 ETH
    },
    inputs: {
      vaultAddress: "0x9a8bC3B04b7f3D87cfC09ba407dCED575f2d61D8", // MEV Capital WETH vault
      supplyAmount: parseEther("3"), // Will wrap 2 ETH
      allowNativeAssetWrapping: true,
    },
  },
  {
    name: "Supply with native asset wrapping only (WETH vault)",
    initialState: {
      walletUnderlyingAssetBalance: 0n, // 0 WETH
      walletNativeAssetBalance: parseEther("5"), // 5 ETH
    },
    inputs: {
      vaultAddress: "0x9a8bC3B04b7f3D87cfC09ba407dCED575f2d61D8", // MEV Capital WETH vault
      supplyAmount: parseEther("2"), // Will wrap 2 ETH
      allowNativeAssetWrapping: true,
    },
  },
  {
    name: "Supply with native asset wrapping near full amount (WETH vault)",
    initialState: {
      walletUnderlyingAssetBalance: parseEther("1"), // 0 WETH
      walletNativeAssetBalance: parseEther("5.01"), // 5 ETH + gas margin...
    },
    inputs: {
      vaultAddress: "0x9a8bC3B04b7f3D87cfC09ba407dCED575f2d61D8", // MEV Capital WETH vault
      supplyAmount: parseEther("6"), // Fully consume WETH and ETH
      allowNativeAssetWrapping: true,
    },
  },
  {
    name: "Supply with native asset wrapping enabled but no shortfall (WETH vault, full wrap)",
    initialState: {
      walletUnderlyingAssetBalance: parseEther("10"), // 1 WETH
      walletNativeAssetBalance: parseEther("5"), // 5 ETH
    },
    inputs: {
      vaultAddress: "0x9a8bC3B04b7f3D87cfC09ba407dCED575f2d61D8", // MEV Capital WETH vault
      supplyAmount: parseEther("2"), // Doesn't need to wrap any
      allowNativeAssetWrapping: true,
    },
  },
  {
    name: "Supply with time delay and balances and approval increasing before execution",
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("2000", 6),
    },
    inputs: {
      vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      supplyAmount: parseUnits("1000", 6),
      allowNativeAssetWrapping: true,
    },
    beforeExecutionCb: async (client) => {
      const {
        bundler3: { generalAdapter1: generalAdapter1Address },
      } = getChainAddresses(client.chain.id)!;

      // Increase of underlying assets
      await client.deal({
        erc20: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        amount: parseUnits("100000", 6),
      });

      // Increase approval to vault and GA1
      await writeContract(client, {
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        abi: erc20Abi,
        functionName: "approve",
        args: ["0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB", maxUint256],
      });
      await writeContract(client, {
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        abi: erc20Abi,
        functionName: "approve",
        args: [generalAdapter1Address, maxUint256],
      });

      // Increase of native assets
      await client.setBalance({
        address: client.account.address,
        value: parseEther("10000"),
      });

      // Let some interest accrue
      await client.mine({ blocks: 1000 });
    },
  },
];

// Shared failure test cases
export const failureTestCases: Array<
  {
    name: string;
    expectedError: string | RegExp;
  } & Omit<
    Erc4626SupplyTestParameters,
    "client" | "supplyActionFn" | "expectedApprovalTargets" | "expectedZeroBalanceAddresses"
  >
> = [
  {
    name: "throws when account address is zero",
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("100", 6),
    },
    inputs: {
      vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      accountAddress: zeroAddress,
      supplyAmount: parseUnits("100", 6),
      allowNativeAssetWrapping: false,
    },
    expectedError: "Invalid input: Account and vault addresses must be distinct and non-zero.",
  },
  {
    name: "throws when account address equals vault address",
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("100", 6),
    },
    inputs: {
      vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      accountAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      supplyAmount: parseUnits("100", 6),
      allowNativeAssetWrapping: false,
    },
    expectedError: "Invalid input: Account and vault addresses must be distinct and non-zero.",
  },
  {
    name: "insufficient balance",
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("100", 6),
    },
    inputs: {
      vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      supplyAmount: parseUnits("1000", 6),
      allowNativeAssetWrapping: false,
    },
    expectedError: "Supply amount exceeds the account balance.",
  },
  {
    name: "zero supply amount",
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("100", 6),
    },
    inputs: {
      vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      supplyAmount: 0n,
      allowNativeAssetWrapping: false,
    },
    expectedError: "Invalid input: Amount must be greater than 0.",
  },
  {
    name: "negative supply amount",
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("100", 6),
    },
    inputs: {
      vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      supplyAmount: -1n,
      allowNativeAssetWrapping: false,
    },
    expectedError: "Invalid input: Amount must be greater than 0.",
  },
  {
    name: "maxUint256 supply amount",
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("100", 6),
    },
    inputs: {
      vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      supplyAmount: maxUint256,
      allowNativeAssetWrapping: false,
    },
    expectedError: "Invalid input: Amount must be less than maxUint256.",
  },
  {
    name: "insufficient total balance even with wrapping (WETH vault)",
    initialState: {
      walletUnderlyingAssetBalance: parseEther("1"), // 1 WETH
      walletNativeAssetBalance: parseEther("0.5"), // 0.5 ETH
    },
    inputs: {
      vaultAddress: "0x9a8bC3B04b7f3D87cfC09ba407dCED575f2d61D8", // MEV Capital WETH vault
      supplyAmount: parseEther("2"), // 2 > 1 WETH + 0.5 ETH
      allowNativeAssetWrapping: true,
    },
    expectedError: "Supply amount exceeds the account balance.",
  },
  {
    name: "wrapping disabled but user has sufficient native balance (WETH vault)",
    initialState: {
      walletUnderlyingAssetBalance: parseEther("1"), // 1 WETH
      walletNativeAssetBalance: parseEther("10"), // 10 ETH (plenty)
    },
    inputs: {
      vaultAddress: "0x9a8bC3B04b7f3D87cfC09ba407dCED575f2d61D8", // MEV Capital WETH vault
      supplyAmount: parseEther("2"), // Trying to supply 2 WETH
      allowNativeAssetWrapping: false, // But wrapping is disabled
    },
    expectedError: "Supply amount exceeds the account balance.",
  },
  {
    name: "wrapping on non-WETH vault doesn't allow action to be attempted",
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("100", 6), // 1000 USDC
      walletNativeAssetBalance: parseUnits("10000", 6), // 10000 USDC (plenty)
    },
    inputs: {
      vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      supplyAmount: parseUnits("1000", 6), // Don't have enough underlying assets
      allowNativeAssetWrapping: true, // Should have no effect
    },
    expectedError: "Supply amount exceeds the account balance.",
  },
  {
    name: "Reverts when wallet balance decreaces below supply amount before execution",
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("2000", 6),
    },
    inputs: {
      vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      supplyAmount: parseUnits("1000", 6),
      allowNativeAssetWrapping: false,
    },
    beforeExecutionCb: async (client) => {
      // Decrease wallets asset balance
      await client.deal({
        erc20: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        amount: parseUnits("500", 6),
      });
    },
    expectedError: /action-tx-reverted/i,
  },
  {
    name: "Reverts when native balance decreaces below required amount before execution, even if underlying increaces",
    initialState: {
      walletUnderlyingAssetBalance: parseEther("50"),
      walletNativeAssetBalance: parseEther("100"),
    },
    inputs: {
      vaultAddress: "0x9a8bC3B04b7f3D87cfC09ba407dCED575f2d61D8",
      supplyAmount: parseEther("100"),
      allowNativeAssetWrapping: true,
    },
    beforeExecutionCb: async (client) => {
      const { wNative } = getChainAddresses(client.chain.id);
      // Increase underling above supply amount
      await client.deal({
        erc20: wNative,
        amount: parseEther("1000"),
      });

      // Decrease native below the 50 which was expected at action build time
      await client.setBalance({
        address: client.account.address,
        value: parseEther("10"),
      });
    },
    expectedError: /action-tx-reverted/i,
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
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("100000", 6),
    },
    inputs: {
      vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      supplyAmount: parseUnits("10000", 6),
      allowNativeAssetWrapping: false,
    },
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
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("2000", 6),
    },
    inputs: {
      vaultAddress,
      supplyAmount: parseUnits("1000", 6),
      allowNativeAssetWrapping: false,
    },
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
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("2000", 6),
    },
    inputs: {
      vaultAddress,
      supplyAmount: parseUnits("1000", 6),
      allowNativeAssetWrapping: false,
    },
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
    initialState: {
      walletUnderlyingAssetBalance: parseUnits("2000", 6),
    },
    inputs: {
      vaultAddress,
      supplyAmount: parseUnits("1000", 6),
      allowNativeAssetWrapping: false,
    },
    supplyActionFn,
    expectedApprovalTargets: [expectedSpenderAddress],
  });

  const erc20Approvals = await extractApprovalEvents(logs, client.account.address);

  // Should have 0 approvals since sufficient allowance already exists
  expect(erc20Approvals).toHaveLength(0);
}
