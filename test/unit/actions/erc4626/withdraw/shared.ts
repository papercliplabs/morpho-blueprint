import { getChainAddresses, MathLib } from "@morpho-org/blue-sdk";
import { fetchVaultConfig, metaMorphoAbi } from "@morpho-org/blue-sdk-viem";
import type { AnvilTestClient } from "@morpho-org/test";
import {
  type Address,
  erc4626Abi,
  isAddressEqual,
  type Log,
  maxUint256,
  parseEther,
  parseUnits,
  zeroAddress,
} from "viem";
import { writeContract } from "viem/actions";
import { expect } from "vitest";
import type { Erc4626WithdrawActionParameters, VaultAction } from "@/actions/types";
import { RANDOM_ADDRESS } from "../../../../helpers/constants";
import { expectZeroErc20Balances } from "../../../../helpers/erc20";
import { executeAction } from "../../../../helpers/executeAction";
import { expectOnlyAllowedApprovals } from "../../../../helpers/logs";
import { createVaultPosition, getVaultPositionAccountingSnapshot } from "../../../../helpers/morpho";

export interface Erc4626WithdrawTestParameters {
  client: AnvilTestClient;

  initialState: {
    vaultPositionBalance: bigint; // assets
    walletUnderlyingAssetBalance?: bigint; // Optional existing wallet balance
    walletNativeAssetBalance?: bigint; // Optional existing wallet balance - defaults to 1000 ETH
  };

  inputs: Omit<Erc4626WithdrawActionParameters, "client" | "accountAddress"> & { accountAddress?: Address };

  beforeExecutionCb?: (client: AnvilTestClient) => Promise<void>; // Runs after action creation, before execution

  // Test configuration
  withdrawActionFn: (params: Erc4626WithdrawActionParameters) => Promise<VaultAction>;
  expectedApprovalTargets: Address[];
  expectedZeroBalanceAddresses?: Address[];
}

export async function runErc4626WithdrawTest({
  client,

  inputs: { vaultAddress, accountAddress = client.account.address, withdrawAmount, unwrapNativeAssets = false },

  initialState,

  beforeExecutionCb,
  withdrawActionFn,
  expectedApprovalTargets,
  expectedZeroBalanceAddresses,
}: Erc4626WithdrawTestParameters): Promise<Log[]> {
  ////
  // Arrange
  ////
  const testAccountAddress = accountAddress ?? client.account.address;
  const vaultConfig = await fetchVaultConfig(vaultAddress, client);
  const assetAddress = vaultConfig.asset;

  await client.impersonateAccount({
    address: testAccountAddress,
  });

  // Seed vault liquidity to ensure withdrawals can succeed (do this FIRST to avoid interest accrual affecting test account)
  await createVaultPosition(client, vaultAddress, initialState.vaultPositionBalance * 10n, RANDOM_ADDRESS);

  // Seed wallet native assets
  await client.setBalance({
    address: client.account.address,
    value: initialState.walletNativeAssetBalance ?? parseEther("1000"),
  });

  // Create initial vault position for test account (only for valid addresses, otherwise will revert)
  const validAddress =
    !isAddressEqual(testAccountAddress, vaultAddress) && !isAddressEqual(testAccountAddress, zeroAddress);
  if (initialState.vaultPositionBalance > 0n && validAddress) {
    await createVaultPosition(client, vaultAddress, initialState.vaultPositionBalance, testAccountAddress);
  }

  // Set any additional underlying asset balance in wallet (done AFTER vault position to ensure clean state)
  if (initialState.walletUnderlyingAssetBalance && initialState.walletUnderlyingAssetBalance > 0n) {
    await client.deal({
      erc20: assetAddress,
      amount: initialState.walletUnderlyingAssetBalance,
    });
  }

  ////
  // Act
  ////

  const beforeBuildSnapshot = await getVaultPositionAccountingSnapshot(client, vaultAddress, testAccountAddress);

  const action = await withdrawActionFn({
    client,
    vaultAddress,
    accountAddress: testAccountAddress,
    withdrawAmount,
    unwrapNativeAssets,
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

  const isFullWithdraw = withdrawAmount === maxUint256;

  // For "full withdraws" (exact shares) we expect the before build snapshot shares to be redeemed (so use share price before execution to calculate)
  const expectedWithdrawnAssets = isFullWithdraw
    ? MathLib.mulDivDown(
        beforeBuildSnapshot.positionShares,
        beforeExecutionSnapshot.positionAssets,
        beforeExecutionSnapshot.positionShares,
      )
    : withdrawAmount;

  const expectedPositionBalance = beforeExecutionSnapshot.positionAssets - expectedWithdrawnAssets;

  expect(afterExecutionSnapshot.positionAssets).toBeGreaterThanOrEqual(expectedPositionBalance - 1n);

  const { wNative: wrappedNativeAssetAddress } = getChainAddresses(client.chain.id);
  const expectUnwrappedNativeAssets = isAddressEqual(assetAddress, wrappedNativeAssetAddress!) && unwrapNativeAssets;

  const expectedWalletNativeBalance =
    beforeExecutionSnapshot.walletNativeAssetBalance + (expectUnwrappedNativeAssets ? expectedWithdrawnAssets : 0n);

  const expectedWalletUnderlyingBalance =
    beforeExecutionSnapshot.walletUnderlyingAssetBalance + (expectUnwrappedNativeAssets ? 0n : expectedWithdrawnAssets);

  expect(afterExecutionSnapshot.walletNativeAssetBalance).toBeGreaterThanOrEqual(expectedWalletNativeBalance - 1n);
  expect(afterExecutionSnapshot.walletUnderlyingAssetBalance).toBeGreaterThanOrEqual(
    expectedWalletUnderlyingBalance - 1n,
  );

  // Make sure no funds left in addresses which we expect zero (ex. bundler or adapters)
  if (expectedZeroBalanceAddresses) {
    await expectZeroErc20Balances(client, expectedZeroBalanceAddresses, assetAddress);
    await expectZeroErc20Balances(client, expectedZeroBalanceAddresses, vaultAddress);
  }

  return logs;
}

// Shared test cases
export const successTestCases: Array<
  {
    name: string;
  } & Omit<
    Erc4626WithdrawTestParameters,
    "client" | "withdrawActionFn" | "expectedApprovalTargets" | "expectedZeroBalanceAddresses" // Provided where used
  >
> = [
  {
    name: "Partial withdraw",
    initialState: {
      vaultPositionBalance: parseUnits("2000", 6),
    },
    inputs: {
      vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      withdrawAmount: parseUnits("1000", 6),
      unwrapNativeAssets: false,
    },
  },
  {
    name: "Partial withdraw, unwrap native does nothing (non-native vault)",
    initialState: {
      vaultPositionBalance: parseUnits("2000", 6),
    },
    inputs: {
      vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      withdrawAmount: parseUnits("1000", 6),
      unwrapNativeAssets: true,
    },
  },
  {
    name: "Partial withdraw with existing underlying asset balance",
    initialState: {
      vaultPositionBalance: parseUnits("2000", 6),
      walletUnderlyingAssetBalance: parseUnits("1000", 6), // Existing 1000 USDC in wallet
    },
    inputs: {
      vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      withdrawAmount: parseUnits("1000", 6),
      unwrapNativeAssets: false,
    },
  },
  {
    name: "Partial withdraw (10%)",
    initialState: {
      vaultPositionBalance: parseUnits("10000", 6),
    },
    inputs: {
      vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      withdrawAmount: parseUnits("1000", 6),
      unwrapNativeAssets: false,
    },
  },
  {
    name: "Full withdraw (maxUint256)",
    initialState: {
      vaultPositionBalance: parseUnits("5000", 6),
    },
    inputs: {
      vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      withdrawAmount: maxUint256,
      unwrapNativeAssets: false,
    },
  },
  {
    name: "Full withdraw with existing wallet balance (maxUint256)",
    initialState: {
      vaultPositionBalance: parseUnits("5000", 6),
      walletUnderlyingAssetBalance: parseUnits("1000", 6),
    },
    inputs: {
      vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      withdrawAmount: maxUint256,
      unwrapNativeAssets: false,
    },
  },
  {
    name: "Partial withdraw with time delay and all balances and approvals increasing before execution",
    initialState: {
      vaultPositionBalance: parseUnits("5000", 6),
      walletUnderlyingAssetBalance: parseUnits("1000", 6),
    },
    inputs: {
      vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      withdrawAmount: parseUnits("1000", 6),
      unwrapNativeAssets: false,
    },
    beforeExecutionCb: async (client) => {
      // Increase of underlying assets
      await client.deal({
        erc20: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        amount: parseUnits("100000", 6),
      });

      // Increase of native assets
      await client.setBalance({
        address: client.account.address,
        value: parseEther("10000"),
      });

      // Increase of vault position
      await createVaultPosition(
        client,
        "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
        parseUnits("50000", 6),
        client.account.address,
      );

      // Give GA1 max share approval
      const {
        bundler3: { generalAdapter1: generalAdapter1Address },
      } = getChainAddresses(client.chain.id)!;
      await writeContract(client, {
        address: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
        abi: metaMorphoAbi,
        functionName: "approve",
        args: [generalAdapter1Address, maxUint256],
      });

      await client.mine({ blocks: 1000 });
    },
  },
  {
    name: "Full withdraw with time delay and all balances increasing before execution",
    initialState: {
      vaultPositionBalance: parseUnits("5000", 6),
      walletUnderlyingAssetBalance: parseUnits("1000", 6),
    },
    inputs: {
      vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      withdrawAmount: maxUint256,
      unwrapNativeAssets: false,
    },
    beforeExecutionCb: async (client) => {
      // Increase of underlying assets
      await client.deal({
        erc20: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        amount: parseUnits("100000", 6),
      });

      // Increase of native assets
      await client.setBalance({
        address: client.account.address,
        value: parseEther("10000"),
      });

      // Increase of vault position
      await createVaultPosition(
        client,
        "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
        parseUnits("50000", 6),
        client.account.address,
      );

      // Give GA1 max share approval
      const {
        bundler3: { generalAdapter1: generalAdapter1Address },
      } = getChainAddresses(client.chain.id)!;
      await writeContract(client, {
        address: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
        abi: metaMorphoAbi,
        functionName: "approve",
        args: [generalAdapter1Address, maxUint256],
      });

      // Let some interest accrue
      await client.mine({ blocks: 1000 });
    },
  },
  {
    name: "Minimal withdraw amount (1 wei)",
    initialState: {
      vaultPositionBalance: parseUnits("1000", 6),
    },
    inputs: {
      vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      withdrawAmount: BigInt(1),
      unwrapNativeAssets: false,
    },
  },
  {
    name: "Near exact amount withdraw",
    initialState: {
      vaultPositionBalance: parseUnits("10000", 6),
    },
    inputs: {
      vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      withdrawAmount: parseUnits("9999", 6),
      unwrapNativeAssets: false,
    },
  },
  {
    name: "Partial withdraw in vault with underlying wrapped native - no unwrap",
    initialState: {
      vaultPositionBalance: parseEther("100"),
    },
    inputs: {
      vaultAddress: "0xBEEf050ecd6a16c4e7bfFbB52Ebba7846C4b8cD4",
      withdrawAmount: parseEther("50"),
      unwrapNativeAssets: false,
    },
  },
  {
    name: "Parital withdraw in vault with underlying wrapped native - unwrap",
    initialState: {
      vaultPositionBalance: parseEther("100"),
    },
    inputs: {
      vaultAddress: "0x31A5684983EeE865d943A696AAC155363bA024f9",
      withdrawAmount: parseEther("50"),
      unwrapNativeAssets: true,
    },
    beforeExecutionCb: async (client) => {
      // Make test account an EOA since wNative.withdraw will revert from anvil default contract account
      await client.setCode({
        address: client.account.address,
        bytecode: "0x",
      });
    },
  },
  {
    name: "Full withdraw in vault with underlying wrapped native - no unwrap",
    initialState: {
      vaultPositionBalance: parseEther("100"),
    },
    inputs: {
      vaultAddress: "0x31A5684983EeE865d943A696AAC155363bA024f9",
      withdrawAmount: maxUint256,
      unwrapNativeAssets: false,
    },
  },
  {
    name: "Full withdraw in vault with underlying wrapped native - unwrap",
    initialState: {
      vaultPositionBalance: parseEther("100"),
    },
    inputs: {
      vaultAddress: "0x31A5684983EeE865d943A696AAC155363bA024f9",
      withdrawAmount: maxUint256,
      unwrapNativeAssets: true,
    },
    beforeExecutionCb: async (client) => {
      // Make test account an EOA since wNative.withdraw will revert from anvil default contract account
      await client.setCode({
        address: client.account.address,
        bytecode: "0x",
      });
    },
  },
];

// Shared failure test cases
export const failureTestCases: Array<
  {
    name: string;
    expectedError: string | RegExp;
  } & Omit<
    Erc4626WithdrawTestParameters,
    "client" | "withdrawActionFn" | "expectedApprovalTargets" | "expectedZeroBalanceAddresses" // Provided where used
  >
> = [
  {
    name: "throws when vault doesn't exist",
    initialState: {
      vaultPositionBalance: parseUnits("100", 6),
    },
    inputs: {
      vaultAddress: "0x0000000000000000000000000000000000000000",
      withdrawAmount: parseUnits("10", 6),
      unwrapNativeAssets: false,
    },
    expectedError: /.*/, // Any error is acceptable
  },
  {
    name: "throws when account address is zero",
    initialState: {
      vaultPositionBalance: parseUnits("100", 6),
    },
    inputs: {
      vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      withdrawAmount: parseUnits("10", 6),
      unwrapNativeAssets: false,
      accountAddress: "0x0000000000000000000000000000000000000000",
    },
    expectedError: "Invalid input: Account and vault addresses must be distinct and non-zero.",
  },
  {
    name: "throws when account address equals vault address",
    initialState: {
      vaultPositionBalance: parseUnits("100", 6),
    },
    inputs: {
      vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      accountAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB", // Same as vault
      withdrawAmount: parseUnits("10", 6),
      unwrapNativeAssets: false,
    },
    expectedError: "Invalid input: Account and vault addresses must be distinct and non-zero.",
  },
  {
    name: "insufficient position balance",
    initialState: {
      vaultPositionBalance: parseUnits("100", 6),
    },
    inputs: {
      vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      withdrawAmount: parseUnits("1000", 6),
      unwrapNativeAssets: false,
    },
    expectedError: /Simulation Error|insufficient/i,
  },
  {
    name: "zero withdraw amount",
    initialState: {
      vaultPositionBalance: parseUnits("100", 6),
    },
    inputs: {
      vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      withdrawAmount: 0n,
      unwrapNativeAssets: false,
    },
    expectedError: "Invalid input: Amount must be greater than 0.",
  },
  {
    name: "negative withdraw amount",
    initialState: {
      vaultPositionBalance: parseUnits("100", 6),
    },
    inputs: {
      vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      withdrawAmount: -1n,
      unwrapNativeAssets: false,
    },
    expectedError: "Invalid input: Amount must be greater than 0.",
  },
  {
    name: "Reverts when insufficient balance upon execution - changed after build",
    initialState: {
      vaultPositionBalance: parseUnits("100", 6),
    },
    inputs: {
      vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      withdrawAmount: parseUnits("10", 6),
      unwrapNativeAssets: false,
    },
    beforeExecutionCb: async (client) => {
      // Withdraw from vault leaving only 5 USDC which is less than the expected withdrawAmount
      await writeContract(client, {
        abi: erc4626Abi,
        address: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
        functionName: "withdraw",
        args: [parseUnits("95", 6), client.account.address, client.account.address],
      });
    },
    expectedError: /action-tx-reverted/i,
  },
];

// Shared slippage test for bundler3
// For withdrawal slippage test, we would need to DECREASE the share price
// However, in MetaMorpho v1.1, share price can't easily be manipulated downward - i.e this is hard to test in the first place
