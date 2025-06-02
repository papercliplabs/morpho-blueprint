import { getChainAddresses } from "@morpho-org/blue-sdk";
import { fetchVaultConfig } from "@morpho-org/blue-sdk-viem";
import { AnvilTestClient } from "@morpho-org/test";
import { Address, Log, maxUint256, parseUnits, zeroAddress } from "viem";
import { describe, expect } from "vitest";

import { vaultWithdrawAction } from "@/actions/vault/vaultWithdrawAction";

import { test } from "../config";
import { expectZeroErc20Balances, getErc20BalanceOf } from "../helpers/erc20";
import { executeAction } from "../helpers/executeAction";
import { expectOnlyAllowedApprovals } from "../helpers/logs";
import { createVaultPosition, getMorphoVaultPosition } from "../helpers/morpho";

interface VaultWithdrawTestParameters {
  client: AnvilTestClient;
  vaultAddress: Address;

  initialState: {
    positionSupplyAmount: bigint;
  };

  withdrawAmount: bigint;

  expectSuccess?: boolean;
  beforeExecutionCb?: (client: AnvilTestClient) => Promise<void>;
  callerType?: "eoa" | "contract";
}

async function runVaultWithdrawTest({
  client,
  vaultAddress,

  initialState,

  withdrawAmount,

  beforeExecutionCb,
  expectSuccess = true,
  callerType = "eoa",
}: VaultWithdrawTestParameters) {
  // Arrange
  const vaultConfig = await fetchVaultConfig(vaultAddress, client);
  const assetAddress = vaultConfig.asset;

  // Intitial state
  await createVaultPosition(client, vaultAddress, initialState.positionSupplyAmount);

  if (callerType === "contract") {
    await client.setCode({ address: client.account.address, bytecode: "0x60006000fd" });
  }

  const {
    permit2,
    bundler3: { bundler3, generalAdapter1 },
  } = getChainAddresses(client.chain.id);

  // Act
  const action = await vaultWithdrawAction({
    publicClient: client,
    vaultAddress,
    accountAddress: client.account.address,
    withdrawAmount,
  });

  await beforeExecutionCb?.(client);

  let logs: Log[] = [];
  if (action.status == "success") {
    // Execute
    logs = await executeAction(client, action);
  }

  // Assert
  expect(action.status).toEqual(expectSuccess ? "success" : "error");

  if (action.status == "error") {
    return action;
  }

  await expectOnlyAllowedApprovals(
    client,
    logs,
    client.account.address,
    [...(permit2 ? [permit2] : []), generalAdapter1], // Only ever allowed to apporve GA1 or permit2
    [generalAdapter1] // Only ever allowed to permit GA1
  );

  const vaultPosition = await getMorphoVaultPosition(client, vaultAddress);
  const userWalletBalance = await getErc20BalanceOf(client, assetAddress, client.account.address);

  // Vault always rounds against the user, hence the 1 margin
  if (withdrawAmount === maxUint256) {
    // Withdraw max when uint256
    expect(vaultPosition).toEqual(BigInt(0));
    expect(userWalletBalance).toBeGreaterThanOrEqual(initialState.positionSupplyAmount);
  } else {
    expect(vaultPosition).toBeGreaterThanOrEqual(initialState.positionSupplyAmount - withdrawAmount - BigInt(1));
    expect(userWalletBalance).toEqual(withdrawAmount);
  }

  // Make sure no funds left in bundler or adapters (underlying assets or shares)
  await expectZeroErc20Balances(client, [bundler3, generalAdapter1], assetAddress);
  await expectZeroErc20Balances(client, [bundler3, generalAdapter1], vaultAddress);

  return action;
}

const successTestCases: ({ name: string } & Omit<VaultWithdrawTestParameters, "client" | "callerType">)[] = [
  {
    name: "Partial withdraw",
    vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
    initialState: {
      positionSupplyAmount: parseUnits("10000000", 6),
    },
    withdrawAmount: parseUnits("100000", 6),
  },
  {
    name: "Full withdraw",
    vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
    initialState: {
      positionSupplyAmount: parseUnits("10000000", 6),
    },
    withdrawAmount: maxUint256,
    beforeExecutionCb: async (client) => {
      // Even if we wait some time for extra interest accural
      await client.mine({ blocks: 1000 });
    },
  },
];

describe("vaultWithdrawAction", () => {
  describe("happy path", () => {
    successTestCases.map((testCase) => {
      test(testCase.name + " - eoa caller", async ({ client }) => {
        await runVaultWithdrawTest({
          client,
          ...testCase,
          callerType: "eoa",
        });
      });
    });

    successTestCases.map((testCase) => {
      test(testCase.name + " - contract caller", async ({ client }) => {
        await runVaultWithdrawTest({
          client,
          ...testCase,
          callerType: "contract",
        });
      });
    });
  });

  describe("sad path", () => {
    test("throws when vault doens't exist", async ({ client }) => {
      await expect(
        runVaultWithdrawTest({
          client,
          vaultAddress: zeroAddress,
          withdrawAmount: parseUnits("1000", 6),
          initialState: {
            positionSupplyAmount: parseUnits("100000", 6),
          },
        })
      ).rejects.toThrow();
    });

    test("insufficient position", async ({ client }) => {
      const result = await runVaultWithdrawTest({
        client,
        vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
        initialState: {
          positionSupplyAmount: parseUnits("100", 6),
        },
        withdrawAmount: parseUnits("1000", 6),
        expectSuccess: false,
      });

      // Will be error otherwise would have failed in run test - this is defined within morpho SDK
      if (result.status == "error") {
        expect(result.message).toContain("Simulation Error: insufficient balance of user");
      }
    });

    test("zero withdraw amount", async ({ client }) => {
      const result = await runVaultWithdrawTest({
        client,
        vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
        initialState: {
          positionSupplyAmount: parseUnits("10", 6),
        },
        withdrawAmount: BigInt(0),
        expectSuccess: false,
      });

      // Will be error otherwise would have failed in run test
      if (result.status == "error") {
        expect(result.message).toEqual("Withdraw amount must be greater than 0.");
      }
    });

    // Note: it's not possible to deflate the share price in metamorpho v1.1 since it doesn't realize market losses.
    // Tried to override storage slot for lastTotalAssets to force a loss realization, but causes other issues since this is used elsewhere in the contract.
    // test("tx should revert if slippage tolerance is exceeded", async ({ client }) => {
    // });
  });
});
