import { getChainAddresses, type MarketId } from "@morpho-org/blue-sdk";
import { blueAbi, fetchMarket } from "@morpho-org/blue-sdk-viem";
import type { AnvilTestClient } from "@morpho-org/test";
import { type Address, type Hex, maxUint256, parseUnits } from "viem";
import { readContract } from "viem/actions";
import { describe, expect } from "vitest";

import { type MarketAction, marketSupplyCollateralAndBorrowAction } from "@/actions";

import { test } from "../../config";
import { expectZeroErc20Balances, getErc20BalanceOf } from "../../helpers/erc20";
import { executeAction } from "../../helpers/executeAction";
import { expectOnlyAllowedApprovals } from "../../helpers/logs";
import { createMarketPosition, getMorphoMarketPosition, seedMarketLiquidity } from "../../helpers/morpho";

const WBTC_USDC_MARKET_ID = "0x3a85e619751152991742810df6ec69ce473daef99e28a64ab2340d7b7ccfee49" as MarketId;

interface MarketSupplyCollateralAndBorrowTestParameters {
  client: AnvilTestClient;
  marketId: Hex;
  allocatingVaultAddresses: Address[];

  intitialState: {
    walletCollateralAmount: bigint;
    positionCollateralAmount: bigint;
    skipMarketSeed?: boolean;
  };

  collateralAmount: bigint;
  borrowAmount: bigint;

  beforeExecutionCb?: (client: AnvilTestClient) => Promise<void>;
  callerType?: "eoa" | "contract";
}

async function runMarketSupplyCollateralAndBorrowTest({
  client,
  marketId,
  allocatingVaultAddresses,

  intitialState,

  collateralAmount,
  borrowAmount,

  beforeExecutionCb,
  callerType = "eoa",
}: MarketSupplyCollateralAndBorrowTestParameters): Promise<MarketAction> {
  // Arrange
  const market = await fetchMarket(marketId as MarketId, client);
  const { collateralToken: collateralAssetAddress, loanToken: loanAssetAddress } = market.params;

  if (callerType === "contract") {
    await client.setCode({ address: client.account.address, bytecode: "0x60006000fd" });
  }

  // Intitial state
  if (intitialState.walletCollateralAmount > 0n) {
    await client.deal({ erc20: collateralAssetAddress, amount: intitialState.walletCollateralAmount });
  }
  if (!intitialState.skipMarketSeed) {
    await seedMarketLiquidity(client, marketId, borrowAmount * 2n);
  }
  if (intitialState.positionCollateralAmount > 0n) {
    await createMarketPosition(client, marketId, intitialState.positionCollateralAmount, 0n);
  }

  const {
    permit2,
    bundler3: { bundler3, generalAdapter1 },
  } = getChainAddresses(client.chain.id);

  // Act
  const action = await marketSupplyCollateralAndBorrowAction({
    publicClient: client,
    marketId: marketId as MarketId,
    allocatingVaultAddresses,
    accountAddress: client.account.address,
    collateralAmount,
    borrowAmount,
  });

  await beforeExecutionCb?.(client);

  const logs = await executeAction(client, action);

  // Assert
  await expectOnlyAllowedApprovals(
    client,
    logs,
    client.account.address,
    [...(permit2 ? [permit2] : []), generalAdapter1], // Only ever allowed to apporve GA1 or permit2
    [generalAdapter1], // Only ever allowed to permit GA1
  );

  const marketPosition = await getMorphoMarketPosition(client, marketId);
  const userWalletLoanAssetBalance = await getErc20BalanceOf(client, loanAssetAddress, client.account.address);
  const userWalletCollateralAssetBalance = await getErc20BalanceOf(
    client,
    collateralAssetAddress,
    client.account.address,
  );

  if (collateralAmount === maxUint256) {
    expect(marketPosition.collateralBalance).toEqual(
      intitialState.positionCollateralAmount + intitialState.walletCollateralAmount,
    );
    expect(userWalletCollateralAssetBalance).toEqual(0n);
  } else {
    expect(marketPosition.collateralBalance).toEqual(intitialState.positionCollateralAmount + collateralAmount);
    expect(userWalletCollateralAssetBalance).toEqual(intitialState.walletCollateralAmount - collateralAmount);
  }

  expect(marketPosition.loanBalance).toBeWithinRange(borrowAmount, borrowAmount + 1n);
  expect(userWalletLoanAssetBalance).toEqual(borrowAmount);

  // Make sure no funds left in bundler or adapters (underlying assets or shares)
  await expectZeroErc20Balances(client, [bundler3, generalAdapter1], collateralAssetAddress);
  await expectZeroErc20Balances(client, [bundler3, generalAdapter1], loanAssetAddress);

  return action;
}

const successTestCases: ({ name: string } & Omit<MarketSupplyCollateralAndBorrowTestParameters, "client">)[] = [
  {
    name: "partial collateral supply, no borrow",
    marketId: WBTC_USDC_MARKET_ID,
    allocatingVaultAddresses: [],
    intitialState: {
      walletCollateralAmount: parseUnits("12", 8),
      positionCollateralAmount: 0n,
    },
    collateralAmount: parseUnits("10", 8),
    borrowAmount: parseUnits("0", 6),
  },
  {
    name: "Full collateral supply, no borrow",
    marketId: WBTC_USDC_MARKET_ID,
    allocatingVaultAddresses: [],
    intitialState: {
      walletCollateralAmount: parseUnits("12", 8),
      positionCollateralAmount: 0n,
    },
    collateralAmount: maxUint256,
    borrowAmount: parseUnits("0", 6),
  },
  {
    name: "partial collateral supply and borrow",
    marketId: WBTC_USDC_MARKET_ID,
    allocatingVaultAddresses: [],
    intitialState: {
      walletCollateralAmount: parseUnits("12", 8),
      positionCollateralAmount: 0n,
    },
    collateralAmount: parseUnits("10", 8),
    borrowAmount: parseUnits("2000", 6),
  },
  {
    name: "full collateral supply and borrow",
    marketId: WBTC_USDC_MARKET_ID,
    allocatingVaultAddresses: [],
    intitialState: {
      walletCollateralAmount: parseUnits("12", 8),
      positionCollateralAmount: 0n,
    },
    collateralAmount: maxUint256,
    borrowAmount: parseUnits("2000", 6),
  },
  {
    name: "borrow against previously supplied collateral",
    marketId: WBTC_USDC_MARKET_ID,
    allocatingVaultAddresses: [],
    intitialState: {
      walletCollateralAmount: 0n,
      positionCollateralAmount: parseUnits("10", 8),
    },
    collateralAmount: 0n,
    borrowAmount: parseUnits("2000", 6),
  },
  {
    name: "borrow using public allocator",
    marketId: WBTC_USDC_MARKET_ID,
    allocatingVaultAddresses: ["0x95EeF579155cd2C5510F312c8fA39208c3Be01a8"],
    intitialState: {
      walletCollateralAmount: 0n,
      positionCollateralAmount: parseUnits("1", 8),
      skipMarketSeed: true,
    },
    collateralAmount: 0n,
    borrowAmount: parseUnits("40000", 6),
  },
];

describe("marketSupplyCollateralAndBorrowAction", () => {
  describe("happy path", () => {
    successTestCases.map((testCase) => {
      test(`${testCase.name} - eoa`, async ({ client }) => {
        await runMarketSupplyCollateralAndBorrowTest({
          client,
          ...testCase,
          callerType: "eoa",
        });
      });

      test(`${testCase.name} - contract`, async ({ client }) => {
        await runMarketSupplyCollateralAndBorrowTest({
          client,
          ...testCase,
          callerType: "contract",
        });
      });
    });
  });

  describe("sad path", () => {
    test("insufficient wallet collateral balance", async ({ client }) => {
      await expect(
        runMarketSupplyCollateralAndBorrowTest({
          client,
          marketId: WBTC_USDC_MARKET_ID,
          allocatingVaultAddresses: [],
          intitialState: {
            walletCollateralAmount: 0n,
            positionCollateralAmount: parseUnits("10", 8),
          },
          collateralAmount: parseUnits("100", 8),
          borrowAmount: 0n,
        }),
      ).rejects.toThrow("Simulation Error: insufficient balance of user");
    });
    test("collateral and borrow both 0", async ({ client }) => {
      await expect(
        runMarketSupplyCollateralAndBorrowTest({
          client,
          marketId: WBTC_USDC_MARKET_ID,
          allocatingVaultAddresses: [],
          intitialState: {
            walletCollateralAmount: 0n,
            positionCollateralAmount: 0n,
          },
          collateralAmount: 0n,
          borrowAmount: 0n,
        }),
      ).rejects.toThrow("Collateral and borrow amounts cannot both be 0.");
    });
    test("prepare error if loan is not sufficently collateralized", async ({ client }) => {
      await expect(
        runMarketSupplyCollateralAndBorrowTest({
          client,
          marketId: WBTC_USDC_MARKET_ID,
          allocatingVaultAddresses: [],
          intitialState: {
            walletCollateralAmount: parseUnits("10", 8),
            positionCollateralAmount: 0n,
          },
          collateralAmount: parseUnits("1", 8),
          borrowAmount: parseUnits("1000000", 6),
        }),
      ).rejects.toThrow("Simulation Error: insufficient collateral for user");
    });

    test("tx reverts if slippage tolerance is exceeded", async ({ client }) => {
      await expect(
        runMarketSupplyCollateralAndBorrowTest({
          client,
          marketId: WBTC_USDC_MARKET_ID,
          allocatingVaultAddresses: [],
          intitialState: {
            walletCollateralAmount: parseUnits("100", 8),
            positionCollateralAmount: 0n,
          },
          collateralAmount: parseUnits("10", 8),
          borrowAmount: parseUnits("10000", 6),
          beforeExecutionCb: async () => {
            const { morpho } = getChainAddresses(client.chain.id);
            const [, , totalBorrowAssets] = await readContract(client, {
              address: morpho,
              abi: blueAbi,
              functionName: "market",
              args: [WBTC_USDC_MARKET_ID],
            });
            // Induce 0.05% slippage
            const newTotalBorrowAssets =
              (totalBorrowAssets * BigInt(Math.floor((1 - 0.0005) * 100000))) / BigInt(100000);
            const borrowSlot = "0xaf5f02fb405ee52198ad944841235017894e4a1f2f9e57ce42e6df356ed67f5e" as Hex; // totalBorrowAssets in lower 128 bits, totalBorrowShares in upper 128 bits
            const slotVal = await client.getStorageAt({
              address: morpho,
              slot: borrowSlot,
            });
            // Extract upper 128 bits (borrowShares)
            const totalBorrowShares = BigInt(slotVal!) >> BigInt(128);
            const newVal = (totalBorrowShares << BigInt(128)) | newTotalBorrowAssets;
            const newSlotVal = `0x${newVal.toString(16).padStart(64, "0")}`;
            // Override totalBorrowAssets to cause slippage
            await client.setStorageAt({
              address: morpho,
              index: borrowSlot,
              value: newSlotVal as Hex,
            });
          },
        }),
      ).rejects.toThrow("action-tx-reverted");
    });
  });
});
