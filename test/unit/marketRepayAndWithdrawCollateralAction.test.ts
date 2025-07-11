import { DEFAULT_SLIPPAGE_TOLERANCE, getChainAddresses, type MarketId, MathLib } from "@morpho-org/blue-sdk";
import { blueAbi, fetchMarket } from "@morpho-org/blue-sdk-viem";
import type { AnvilTestClient } from "@morpho-org/test";
import { type Hex, type Log, maxUint256, parseUnits } from "viem";
import { readContract } from "viem/actions";
import { describe, expect } from "vitest";

import { type MarketAction, marketRepayAndWithdrawCollateralAction } from "@/actions";

import { test } from "../config";
import { expectZeroErc20Balances, getErc20BalanceOf } from "../helpers/erc20";
import { executeAction } from "../helpers/executeAction";
import { expectOnlyAllowedApprovals } from "../helpers/logs";
import { createMarketPosition, getMorphoMarketPosition } from "../helpers/morpho";

const WBTC_USDC_MARKET_ID = "0x3a85e619751152991742810df6ec69ce473daef99e28a64ab2340d7b7ccfee49" as MarketId;

interface MarketRepayAndWithdrawCollateralTestParameters {
  client: AnvilTestClient;
  marketId: Hex;

  initialState: {
    positionCollateralBalance: bigint;
    positionLoanBalance: bigint;
    walletLoanAssetBalance: bigint;
  };

  repayAmount: bigint;
  withdrawCollateralAmount: bigint;

  expectSuccess?: boolean;
  beforeExecutionCb?: (client: AnvilTestClient) => Promise<void>;
  callerType?: "eoa" | "contract";
}

async function runMarketRepayAndWithdrawCollateralTest({
  client,
  marketId,

  initialState,

  repayAmount,
  withdrawCollateralAmount,

  expectSuccess = true,
  beforeExecutionCb,
  callerType = "eoa",
}: MarketRepayAndWithdrawCollateralTestParameters): Promise<MarketAction> {
  // Arrange
  const market = await fetchMarket(marketId as MarketId, client);
  const { collateralToken: collateralAssetAddress, loanToken: loanAssetAddress } = market.params;

  if (callerType === "contract") {
    await client.setCode({ address: client.account.address, bytecode: "0x60006000fd" });
  }

  // Initial state
  if (initialState.positionLoanBalance > 0n || initialState.positionCollateralBalance > 0n) {
    await createMarketPosition(
      client,
      marketId,
      initialState.positionCollateralBalance,
      initialState.positionLoanBalance,
    );
    // Overrides the loan amount recieved from initial loan
    await client.deal({ erc20: loanAssetAddress, amount: 0n });
  }
  if (initialState.walletLoanAssetBalance > 0n) {
    await client.deal({ erc20: loanAssetAddress, amount: initialState.walletLoanAssetBalance });
  }

  const {
    permit2,
    bundler3: { bundler3, generalAdapter1 },
  } = getChainAddresses(client.chain.id);

  // Act
  const action = await marketRepayAndWithdrawCollateralAction({
    publicClient: client,
    marketId: marketId as MarketId,
    accountAddress: client.account.address,
    repayAmount,
    withdrawCollateralAmount,
  });

  await beforeExecutionCb?.(client);

  let logs: Log[] = [];
  if (action.status === "success") {
    // Execute
    logs = await executeAction(client, action);
  }

  // Assert
  expect(action.status).toEqual(expectSuccess ? "success" : "error");

  // Would already fail if it was not expected to
  if (action.status === "error") {
    return action;
  }

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

  if (repayAmount === maxUint256) {
    expect(marketPosition.loanBalance).toEqual(0n);
    expect(userWalletLoanAssetBalance).toBeWithinRange(
      MathLib.mulDivUp(
        initialState.walletLoanAssetBalance - initialState.positionLoanBalance,
        DEFAULT_SLIPPAGE_TOLERANCE,
        MathLib.WAD,
      ),
      initialState.walletLoanAssetBalance - initialState.positionLoanBalance,
    );
  } else {
    expect(marketPosition.loanBalance).toBeWithinRange(
      initialState.positionLoanBalance - repayAmount,
      initialState.positionLoanBalance - repayAmount + 1n,
    );
    expect(userWalletLoanAssetBalance).toEqual(initialState.walletLoanAssetBalance - repayAmount);
  }

  if (withdrawCollateralAmount === maxUint256) {
    expect(marketPosition.collateralBalance).toEqual(0n);
    expect(userWalletCollateralAssetBalance).toEqual(initialState.positionCollateralBalance);
  } else {
    expect(marketPosition.collateralBalance).toEqual(initialState.positionCollateralBalance - withdrawCollateralAmount);
    expect(userWalletCollateralAssetBalance).toEqual(withdrawCollateralAmount);
  }

  // Make sure no funds left in bundler or adapters (underlying assets or shares)
  await expectZeroErc20Balances(client, [bundler3, generalAdapter1], collateralAssetAddress);
  await expectZeroErc20Balances(client, [bundler3, generalAdapter1], loanAssetAddress);

  return action;
}

const successTestCases: ({ name: string } & Omit<MarketRepayAndWithdrawCollateralTestParameters, "client">)[] = [
  {
    name: "no repay, partial withdraw collateral",
    marketId: WBTC_USDC_MARKET_ID,
    initialState: {
      positionCollateralBalance: parseUnits("10", 18),
      positionLoanBalance: parseUnits("100", 6),
      walletLoanAssetBalance: parseUnits("0", 6),
    },
    repayAmount: parseUnits("0", 6),
    withdrawCollateralAmount: parseUnits("0.01", 18),
  },
  {
    name: "partial repay, no withdraw collateral",
    marketId: WBTC_USDC_MARKET_ID,
    initialState: {
      positionCollateralBalance: parseUnits("10", 18),
      positionLoanBalance: parseUnits("100", 6),
      walletLoanAssetBalance: parseUnits("1000", 6),
    },
    repayAmount: parseUnits("10", 6),
    withdrawCollateralAmount: parseUnits("0", 18),
  },
  {
    name: "partial repay, partial withdraw collateral",
    marketId: WBTC_USDC_MARKET_ID,
    initialState: {
      positionCollateralBalance: parseUnits("10", 18),
      positionLoanBalance: parseUnits("100", 6),
      walletLoanAssetBalance: parseUnits("1000", 6),
    },
    repayAmount: parseUnits("10", 6),
    withdrawCollateralAmount: parseUnits("1", 18),
  },
  {
    name: "full repay, no withdraw collateral",
    marketId: WBTC_USDC_MARKET_ID,
    initialState: {
      positionCollateralBalance: parseUnits("10", 18),
      positionLoanBalance: parseUnits("100", 6),
      walletLoanAssetBalance: parseUnits("1000", 6),
    },
    repayAmount: maxUint256,
    withdrawCollateralAmount: parseUnits("0", 18),
  },
  {
    name: "full repay, partial withdraw collateral",
    marketId: WBTC_USDC_MARKET_ID,
    initialState: {
      positionCollateralBalance: parseUnits("10", 18),
      positionLoanBalance: parseUnits("100", 6),
      walletLoanAssetBalance: parseUnits("1000", 6),
    },
    repayAmount: maxUint256,
    withdrawCollateralAmount: parseUnits("2", 18),
  },
  {
    name: "full repay, full withdraw collateral",
    marketId: WBTC_USDC_MARKET_ID,
    initialState: {
      positionCollateralBalance: parseUnits("10", 18),
      positionLoanBalance: parseUnits("1000", 6),
      walletLoanAssetBalance: parseUnits("10000", 6),
    },
    repayAmount: maxUint256,
    withdrawCollateralAmount: maxUint256,
  },
];

describe("marketRepayAndWithdrawCollateralAction", () => {
  describe("happy path", () => {
    successTestCases.map((testCase) => {
      test(`${testCase.name} - eoa`, async ({ client }) => {
        await runMarketRepayAndWithdrawCollateralTest({
          client,
          ...testCase,
          callerType: "eoa",
        });
      });

      test(`${testCase.name} - contract`, async ({ client }) => {
        await runMarketRepayAndWithdrawCollateralTest({
          client,
          ...testCase,
          callerType: "contract",
        });
      });
    });
  });

  describe("sad path", () => {
    test("repay and withdraw both 0", async ({ client }) => {
      const result = await runMarketRepayAndWithdrawCollateralTest({
        client,
        marketId: WBTC_USDC_MARKET_ID,
        initialState: {
          positionCollateralBalance: parseUnits("10", 18),
          positionLoanBalance: parseUnits("1000", 6),
          walletLoanAssetBalance: parseUnits("1000", 6),
        },
        repayAmount: parseUnits("0", 6),
        withdrawCollateralAmount: parseUnits("0", 18),
        expectSuccess: false,
      });

      // It will, otherwise will fail in run test
      if (result.status === "error") {
        expect(result.message).toEqual("Repay and withdraw collateral amounts cannot both be 0.");
      }
    });
    test("insufficient repay balance", async ({ client }) => {
      const result = await runMarketRepayAndWithdrawCollateralTest({
        client,
        marketId: WBTC_USDC_MARKET_ID,
        initialState: {
          positionCollateralBalance: parseUnits("10", 18),
          positionLoanBalance: parseUnits("1000", 6),
          walletLoanAssetBalance: parseUnits("5", 6),
        },
        repayAmount: parseUnits("10", 6),
        withdrawCollateralAmount: parseUnits("0", 18),
        expectSuccess: false,
      });

      // It will, otherwise will fail in run test
      if (result.status === "error") {
        expect(result.message).toContain("Simulation Error: insufficient balance of user");
      }
    });
    test("repay exceeds position balance", async ({ client }) => {
      const result = await runMarketRepayAndWithdrawCollateralTest({
        client,
        marketId: WBTC_USDC_MARKET_ID,
        initialState: {
          positionCollateralBalance: parseUnits("10", 18),
          positionLoanBalance: parseUnits("500", 6),
          walletLoanAssetBalance: parseUnits("2000", 6),
        },
        repayAmount: parseUnits("1000", 6),
        withdrawCollateralAmount: parseUnits("0", 18),
        expectSuccess: false,
      });

      if (result.status === "error") {
        expect(result.message).toContain("Simulation Error: insufficient position for user");
      }
    });
    test("withdraw collateral exceeds position balance", async ({ client }) => {
      const result = await runMarketRepayAndWithdrawCollateralTest({
        client,
        marketId: WBTC_USDC_MARKET_ID,
        initialState: {
          positionCollateralBalance: parseUnits("10", 18),
          positionLoanBalance: parseUnits("100", 6),
          walletLoanAssetBalance: parseUnits("200", 6),
        },
        repayAmount: maxUint256,
        withdrawCollateralAmount: parseUnits("100", 18),
        expectSuccess: false,
      });

      if (result.status === "error") {
        expect(result.message).toContain("Simulation Error: insufficient position for user");
      }
    });
    test("prepare error if loan is not sufficently collateralized", async ({ client }) => {
      const result = await runMarketRepayAndWithdrawCollateralTest({
        client,
        marketId: WBTC_USDC_MARKET_ID,
        initialState: {
          positionCollateralBalance: parseUnits("10", 18),
          positionLoanBalance: parseUnits("1000", 6),
          walletLoanAssetBalance: parseUnits("5", 6),
        },
        repayAmount: parseUnits("0", 6),
        withdrawCollateralAmount: parseUnits("10", 18),
        expectSuccess: false,
      });

      if (result.status === "error") {
        expect(result.message).toContain("Simulation Error: insufficient collateral for user");
      }
    });
    test("tx reverts if slippage tolerance is exceeded", async ({ client }) => {
      await expect(
        runMarketRepayAndWithdrawCollateralTest({
          client,
          marketId: WBTC_USDC_MARKET_ID,
          initialState: {
            positionCollateralBalance: parseUnits("100", 18),
            positionLoanBalance: parseUnits("100", 6),
            walletLoanAssetBalance: parseUnits("10", 6),
          },
          repayAmount: parseUnits("5", 6),
          withdrawCollateralAmount: BigInt(0),
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
              (totalBorrowAssets * BigInt(Math.floor((1 + 0.0005) * 100000))) / BigInt(100000);
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
