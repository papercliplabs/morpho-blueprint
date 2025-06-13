import { MathLib, getChainAddresses } from "@morpho-org/blue-sdk";
import { fetchVaultConfig, metaMorphoAbi } from "@morpho-org/blue-sdk-viem";
import { AnvilTestClient } from "@morpho-org/test";
import { Address, Log, maxUint256, parseEther, parseUnits, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, expect } from "vitest";

import { VaultAction, vaultSupplyAction } from "@/actions";

import { test } from "../config";
import { RANDOM_ADDRESS } from "../helpers/constants";
import { expectZeroErc20Balances, getErc20BalanceOf } from "../helpers/erc20";
import { executeAction } from "../helpers/executeAction";
import { expectOnlyAllowedApprovals } from "../helpers/logs";
import { createVaultPosition, getMorphoVaultPosition, seedMarketLiquidity } from "../helpers/morpho";

interface VaultSupplyTestParameters {
  client: AnvilTestClient;
  vaultAddress: Address;

  intitialState: {
    walletUnderlyingAssetBalance: bigint;
  };

  supplyAmount: bigint;

  expectSuccess?: boolean;
  beforeExecutionCb?: (client: AnvilTestClient) => Promise<void>;
  callerType?: "eoa" | "contract";
}

async function runVaultSupplyTest({
  client,
  vaultAddress,

  intitialState,

  supplyAmount,

  beforeExecutionCb,
  expectSuccess = true,
  callerType = "eoa",
}: VaultSupplyTestParameters): Promise<VaultAction> {
  // Arrange
  const vaultConfig = await fetchVaultConfig(vaultAddress, client);
  const assetAddress = vaultConfig.asset;

  if (callerType === "contract") {
    await client.setCode({ address: client.account.address, bytecode: "0x60006000fd" });
  }

  // Provide gas
  await client.setBalance({ address: client.account.address, value: parseEther("1000") });

  // Intitial state
  await client.deal({ erc20: assetAddress, amount: intitialState.walletUnderlyingAssetBalance });

  // Seed vault liquidity to avoid issues around 0 balances
  await createVaultPosition(client, vaultAddress, intitialState.walletUnderlyingAssetBalance * 4n, RANDOM_ADDRESS);

  const {
    permit2,
    bundler3: { bundler3, generalAdapter1 },
  } = getChainAddresses(client.chain.id);

  // Act
  const action = await vaultSupplyAction({
    publicClient: client,
    vaultAddress,
    accountAddress: client.account.address,
    supplyAmount,
    allowWrappingNativeAssets: false,
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

  if (supplyAmount == maxUint256) {
    // Max supply
    expect(vaultPosition).toBeWithinRange(
      intitialState.walletUnderlyingAssetBalance - BigInt(1),
      intitialState.walletUnderlyingAssetBalance
    );
    expect(userWalletBalance).toEqual(BigInt(0));
  } else {
    // Partial supply
    expect(vaultPosition).toBeWithinRange(supplyAmount - BigInt(1), supplyAmount);
    expect(userWalletBalance).toEqual(intitialState.walletUnderlyingAssetBalance - supplyAmount);
  }

  // Make sure no funds left in bundler or adapters (underlying assets or shares)
  await expectZeroErc20Balances(client, [bundler3, generalAdapter1], assetAddress);
  await expectZeroErc20Balances(client, [bundler3, generalAdapter1], vaultAddress);

  return action;
}

const successTestCases: ({ name: string } & Omit<VaultSupplyTestParameters, "client">)[] = [
  {
    name: "Partial supply",
    vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
    intitialState: {
      walletUnderlyingAssetBalance: parseUnits("2000", 6),
    },
    supplyAmount: parseUnits("1000", 6),
  },
  {
    name: "Full supply",
    vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
    intitialState: {
      walletUnderlyingAssetBalance: parseUnits("2000", 6),
    },
    supplyAmount: maxUint256,
  },
];

describe("vaultSupplyAction", () => {
  describe("happy path", () => {
    successTestCases.map((testCase) => {
      test(`${testCase.name} - eoa`, async ({ client }) => {
        await runVaultSupplyTest({
          client,
          ...testCase,
          callerType: "eoa",
        });
      });
      test(`${testCase.name} - contract`, async ({ client }) => {
        await runVaultSupplyTest({
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
        runVaultSupplyTest({
          client,
          vaultAddress: zeroAddress,
          intitialState: {
            walletUnderlyingAssetBalance: parseUnits("100", 6),
          },
          supplyAmount: parseUnits("1000", 6),
          expectSuccess: false,
        })
      ).rejects.toThrow();
    });
    test("insufficient balance", async ({ client }) => {
      const result = await runVaultSupplyTest({
        client,
        vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
        intitialState: {
          walletUnderlyingAssetBalance: parseUnits("100", 6),
        },
        supplyAmount: parseUnits("1000", 6),
        expectSuccess: false,
      });

      // Will be error otherwise would have failed in run test
      if (result.status == "error") {
        expect(result.message).toEqual("Simulation Error: Insufficient wallet balance.");
      }
    });
    test("zero supply amount", async ({ client }) => {
      const result = await runVaultSupplyTest({
        client,
        vaultAddress: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
        intitialState: {
          walletUnderlyingAssetBalance: parseUnits("100", 6),
        },
        supplyAmount: 0n,
        expectSuccess: false,
      });

      // Will be error otherwise would have failed in run test
      if (result.status == "error") {
        expect(result.message).toEqual("Supply amount must be greater than 0.");
      }
    });
    test("tx should revert if slippage tolerance is exceeded", async ({ client }) => {
      const vaultAddress = "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB";

      const totalAssetsBefore = await readContract(client, {
        address: vaultAddress,
        abi: metaMorphoAbi,
        functionName: "totalAssets",
      });

      // Increase the share price by 0.05%, which is above the acceptable slippage tolerance
      const donationAmount = MathLib.mulDivUp(totalAssetsBefore, BigInt(0.0005 * Number(MathLib.WAD)), MathLib.WAD);

      await client.setBalance({ address: RANDOM_ADDRESS, value: parseEther("10") });
      await expect(
        runVaultSupplyTest({
          client,
          vaultAddress,
          intitialState: {
            walletUnderlyingAssetBalance: parseUnits("100000", 6),
          },
          supplyAmount: parseUnits("10000", 6),
          beforeExecutionCb: async () => {
            // Supply to a market on behalf of vault to manipulate (increacing) the share price (totalAssets / totalShares)
            // Note that vaults totalAssets is the sum over it's assets in each of the allocating markets
            // So, one way to manipulate the share price is a large "donation" to a market on behalf of the vault
            await seedMarketLiquidity(
              client,
              "0x64d65c9a2d91c36d56fbc42d69e979335320169b3df63bf92789e2c8883fcc64",
              donationAmount,
              vaultAddress
            );
          },
        })
      ).rejects.toThrow("action-tx-reverted");
    });
  });
});
