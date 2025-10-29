import { parseUnits } from "viem";
import { describe, expect, it } from "vitest";
import { createMarketRepayAndWithdrawCollateralFormSchema } from "@/components/forms/market-repay-and-withdraw-collateral/schema";
import { createMarketSupplyCollateralAndBorrowFormSchema } from "@/components/forms/market-supply-collateral-and-borrow/schema";
import { createVaultSupplyFormSchema } from "@/components/forms/vault-supply/schema";
import { createVaultWithdrawFormSchema } from "@/components/forms/vault-withdraw/schema";
import type { MarketNonIdle } from "@/data/whisk/getMarket";
import type { MarketPosition } from "@/data/whisk/getMarketPositions";

/**
 * Security tests for form validation schemas
 * Focus: Business logic validation, position health checks
 */

describe("Form Schema Security Tests", () => {
  describe("VaultSupplyFormSchema", () => {
    it("should enforce balance limits", () => {
      const balance = parseUnits("100", 6);
      const schema = createVaultSupplyFormSchema(6, balance);

      expect(schema.parse({ supplyAmount: "100", isMaxSupply: false }).supplyAmount).toBe(100000000n);
      expect(() => schema.parse({ supplyAmount: "100.000001", isMaxSupply: false })).toThrow("Amount exceeds balance");
    });

    it("should allow supply up to exact balance", () => {
      const balance = parseUnits("100", 6);
      const schema = createVaultSupplyFormSchema(6, balance);

      const result = schema.parse({ supplyAmount: "100", isMaxSupply: false });
      expect(result.supplyAmount).toBe(balance);
    });

    it("should work without balance (no max limit)", () => {
      const schema = createVaultSupplyFormSchema(6, undefined);

      const result = schema.parse({ supplyAmount: "1000000", isMaxSupply: false });
      expect(result.supplyAmount).toBeGreaterThan(0n);
    });
  });

  describe("MarketSupplyCollateralAndBorrowFormSchema - Critical Health Checks", () => {
    it("should prevent borrowing more than collateral allows", () => {
      const market = createMockMarket({
        collateralPrice: parseUnits("2000", 18),
        lltv: parseUnits("0.8", 18),
      });

      const schema = createMarketSupplyCollateralAndBorrowFormSchema(market);

      const result = schema.safeParse({
        supplyCollateralAmount: "1",
        isMaxSupplyCollateral: false,
        borrowAmount: "2000",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message === "Causes unhealthy position.")).toBe(true);
      }
    });

    it("should require at least one amount (can't both be zero)", () => {
      const market = createMockMarket({
        collateralPrice: parseUnits("2000", 18),
        lltv: parseUnits("0.8", 18),
      });

      const schema = createMarketSupplyCollateralAndBorrowFormSchema(market);

      const result = schema.safeParse({
        supplyCollateralAmount: "0",
        isMaxSupplyCollateral: false,
        borrowAmount: "0",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message === "One amount is required.")).toBe(true);
      }
    });

    it("should allow supplying collateral without borrowing", () => {
      const market = createMockMarket({
        collateralPrice: parseUnits("2000", 18),
        lltv: parseUnits("0.8", 18),
      });

      const schema = createMarketSupplyCollateralAndBorrowFormSchema(market);

      const result = schema.parse({
        supplyCollateralAmount: "1",
        isMaxSupplyCollateral: false,
        borrowAmount: "0",
      });

      expect(result.supplyCollateralAmount).toBe(parseUnits("1", 18));
      expect(result.borrowAmount).toBe(0n);
    });

    it("should enforce wallet balance limits", () => {
      const market = createMockMarket({
        collateralPrice: parseUnits("2000", 18),
        lltv: parseUnits("0.8", 18),
      });

      const position = createMockPosition({
        walletBalance: parseUnits("5", 18),
        borrowed: 0n,
      });

      const schema = createMarketSupplyCollateralAndBorrowFormSchema(market, position);

      expect(() =>
        schema.parse({
          supplyCollateralAmount: "10",
          isMaxSupplyCollateral: false,
          borrowAmount: "0",
        }),
      ).toThrow("Amount exceeds wallet balance");
    });

    it("should account for existing borrow when checking health", () => {
      const market = createMockMarket({
        collateralPrice: parseUnits("2000", 18),
        lltv: parseUnits("0.8", 18),
      });

      const position = createMockPosition({
        walletBalance: parseUnits("10", 18),
        borrowed: parseUnits("1000", 6),
      });

      const schema = createMarketSupplyCollateralAndBorrowFormSchema(market, position);

      const result = schema.safeParse({
        supplyCollateralAmount: "1",
        isMaxSupplyCollateral: false,
        borrowAmount: "1000",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message === "Causes unhealthy position.")).toBe(true);
      }
    });

    it("should handle zero LLTV safely", () => {
      const market = createMockMarket({
        collateralPrice: parseUnits("2000", 18),
        lltv: 0n,
      });

      const schema = createMarketSupplyCollateralAndBorrowFormSchema(market);

      const result = schema.safeParse({
        supplyCollateralAmount: "1",
        isMaxSupplyCollateral: false,
        borrowAmount: "100",
      });

      expect(result.success).toBe(false);
    });

    it("should handle zero price (oracle failure) safely", () => {
      const market = createMockMarket({
        collateralPrice: 0n,
        lltv: parseUnits("0.8", 18),
      });

      const schema = createMarketSupplyCollateralAndBorrowFormSchema(market);

      const result = schema.safeParse({
        supplyCollateralAmount: "1",
        isMaxSupplyCollateral: false,
        borrowAmount: "100",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("VaultWithdrawFormSchema", () => {
    it("should enforce position balance limits", () => {
      const positionBalance = parseUnits("50", 6);
      const schema = createVaultWithdrawFormSchema(6, positionBalance);

      expect(schema.parse({ withdrawAmount: "50", isMaxWithdraw: false }).withdrawAmount).toBe(50000000n);
      expect(() => schema.parse({ withdrawAmount: "50.000001", isMaxWithdraw: false })).toThrow(
        "Amount exceeds position",
      );
    });

    it("should allow withdrawal up to exact position balance", () => {
      const positionBalance = parseUnits("100", 6);
      const schema = createVaultWithdrawFormSchema(6, positionBalance);

      const result = schema.parse({ withdrawAmount: "100", isMaxWithdraw: false });
      expect(result.withdrawAmount).toBe(positionBalance);
    });

    it("should work without position (no max limit)", () => {
      const schema = createVaultWithdrawFormSchema(6, undefined);

      const result = schema.parse({ withdrawAmount: "1000000", isMaxWithdraw: false });
      expect(result.withdrawAmount).toBeGreaterThan(0n);
    });
  });

  describe("MarketRepayAndWithdrawCollateralFormSchema - Health Validation", () => {
    it("should prevent withdrawing collateral that causes unhealthy position", () => {
      const market = createMockMarket({
        collateralPrice: parseUnits("2000", 18),
        lltv: parseUnits("0.8", 18),
      });

      const position = createMockPositionWithCollateral({
        walletLoanBalance: parseUnits("10000", 6),
        walletCollateralBalance: parseUnits("10", 18),
        positionCollateral: parseUnits("2", 18),
        positionBorrowed: parseUnits("2000", 6),
      });

      const schema = createMarketRepayAndWithdrawCollateralFormSchema(market, position);

      const result = schema.safeParse({
        repayAmount: "0",
        isMaxRepay: false,
        withdrawCollateralAmount: "1.5",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message === "Causes unhealthy position.")).toBe(true);
      }
    });

    it("should require at least one amount", () => {
      const market = createMockMarket({
        collateralPrice: parseUnits("2000", 18),
        lltv: parseUnits("0.8", 18),
      });

      const schema = createMarketRepayAndWithdrawCollateralFormSchema(market);

      const result = schema.safeParse({
        repayAmount: "0",
        isMaxRepay: false,
        withdrawCollateralAmount: "0",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message === "One amount is required.")).toBe(true);
      }
    });

    it("should enforce repay limits based on position vs wallet", () => {
      const market = createMockMarket({
        collateralPrice: parseUnits("2000", 18),
        lltv: parseUnits("0.8", 18),
      });

      const positionWithLowWallet = createMockPositionWithCollateral({
        walletLoanBalance: parseUnits("500", 6),
        walletCollateralBalance: parseUnits("10", 18),
        positionCollateral: parseUnits("2", 18),
        positionBorrowed: parseUnits("1000", 6),
      });

      const schema = createMarketRepayAndWithdrawCollateralFormSchema(market, positionWithLowWallet);

      expect(() =>
        schema.parse({
          repayAmount: "600",
          isMaxRepay: false,
          withdrawCollateralAmount: "0",
        }),
      ).toThrow("Exceeds wallet balance");
    });

    it("should handle zero LLTV safely", () => {
      const market = createMockMarket({
        collateralPrice: parseUnits("2000", 18),
        lltv: 0n,
      });

      const position = createMockPositionWithCollateral({
        walletLoanBalance: parseUnits("10000", 6),
        walletCollateralBalance: parseUnits("10", 18),
        positionCollateral: parseUnits("2", 18),
        positionBorrowed: parseUnits("1000", 6),
      });

      const schema = createMarketRepayAndWithdrawCollateralFormSchema(market, position);

      expect(() =>
        schema.parse({
          repayAmount: "0",
          isMaxRepay: false,
          withdrawCollateralAmount: "0.5",
        }),
      ).not.toThrow();
    });

    it("should handle zero price (oracle failure) safely", () => {
      const market = createMockMarket({
        collateralPrice: 0n,
        lltv: parseUnits("0.8", 18),
      });

      const position = createMockPositionWithCollateral({
        walletLoanBalance: parseUnits("10000", 6),
        walletCollateralBalance: parseUnits("10", 18),
        positionCollateral: parseUnits("2", 18),
        positionBorrowed: parseUnits("1000", 6),
      });

      const schema = createMarketRepayAndWithdrawCollateralFormSchema(market, position);

      expect(() =>
        schema.parse({
          repayAmount: "0",
          isMaxRepay: false,
          withdrawCollateralAmount: "0.5",
        }),
      ).not.toThrow();
    });
  });
});

function createMockMarket({ collateralPrice, lltv }: { collateralPrice: bigint; lltv: bigint }): MarketNonIdle {
  return {
    collateralAsset: { decimals: 18 },
    loanAsset: { decimals: 6 },
    collateralPriceInLoanAsset: {
      raw: collateralPrice.toString(),
    },
    lltv: {
      raw: lltv.toString(),
    },
  } as MarketNonIdle;
}

function createMockPosition({ walletBalance, borrowed }: { walletBalance: bigint; borrowed: bigint }): MarketPosition {
  return {
    walletCollateralAssetHolding: {
      balance: {
        raw: walletBalance.toString(),
      },
    },
    borrowAmount: {
      raw: borrowed.toString(),
    },
  } as MarketPosition;
}

function createMockPositionWithCollateral({
  walletLoanBalance,
  walletCollateralBalance,
  positionCollateral,
  positionBorrowed,
}: {
  walletLoanBalance: bigint;
  walletCollateralBalance: bigint;
  positionCollateral: bigint;
  positionBorrowed: bigint;
}): MarketPosition {
  return {
    walletLoanAssetHolding: {
      balance: {
        raw: walletLoanBalance.toString(),
      },
    },
    walletCollateralAssetHolding: {
      balance: {
        raw: walletCollateralBalance.toString(),
      },
    },
    collateralAmount: {
      raw: positionCollateral.toString(),
    },
    borrowAmount: {
      raw: positionBorrowed.toString(),
    },
  } as MarketPosition;
}
