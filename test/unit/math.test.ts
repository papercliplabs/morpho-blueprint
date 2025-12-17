import { fc, test } from "@fast-check/vitest";
import { parseUnits } from "viem";
import { describe, expect, it } from "vitest";
import type { MarketNonIdle } from "@/modules/market/data/getMarket";
import { computeMaxBorrow } from "@/modules/market/utils/computeMaxBorrow";
import { computeRequiredCollateral } from "@/modules/market/utils/computeRequiredCollateral";

/**
 * Property-Based Security Tests for Math Utilities
 * Uses fast-check to verify properties hold across many random inputs
 */

describe("Math Security Tests", () => {
  describe("computeMaxBorrow - Critical Properties", () => {
    test.prop({
      collateralAmount: fc.bigInt({ min: 0n, max: parseUnits("1000", 18) }),
      collateralPrice: fc.bigInt({ min: parseUnits("1", 18), max: parseUnits("10000", 18) }),
      lltv: fc.bigInt({ min: 0n, max: parseUnits("0.95", 18) }),
    })("should never return negative values", ({ collateralAmount, collateralPrice, lltv }) => {
      const market = createMockMarket(collateralPrice, lltv);
      const maxBorrow = computeMaxBorrow(market, collateralAmount);

      expect(maxBorrow).toBeGreaterThanOrEqual(0n);
    });

    test.prop({
      collateralAmount: fc.bigInt({ min: 1000n, max: parseUnits("100", 18) }),
      collateralPrice: fc.bigInt({ min: parseUnits("100", 18), max: parseUnits("5000", 18) }),
      lltv: fc.bigInt({ min: parseUnits("0.5", 18), max: parseUnits("0.9", 18) }),
    })("should increase with more collateral", ({ collateralAmount, collateralPrice, lltv }) => {
      const market = createMockMarket(collateralPrice, lltv);
      const maxBorrow1 = computeMaxBorrow(market, collateralAmount);
      const maxBorrow2 = computeMaxBorrow(market, collateralAmount + 1000n);

      expect(maxBorrow2).toBeGreaterThanOrEqual(maxBorrow1);
    });

    it("should return 0 when oracle price is 0 (failure case)", () => {
      const market = createMockMarket(0n, parseUnits("0.8", 18));
      const maxBorrow = computeMaxBorrow(market, parseUnits("10", 18));

      expect(maxBorrow).toBe(0n);
    });

    it("should return 0 when LLTV is 0", () => {
      const market = createMockMarket(parseUnits("1000", 18), 0n);
      const maxBorrow = computeMaxBorrow(market, parseUnits("10", 18));

      expect(maxBorrow).toBe(0n);
    });

    it("should handle very large collateral without overflow", () => {
      const market = createMockMarket(parseUnits("1000", 18), parseUnits("0.8", 18));
      const hugeCollateral = parseUnits("1000000", 18);

      expect(() => computeMaxBorrow(market, hugeCollateral)).not.toThrow();
      const result = computeMaxBorrow(market, hugeCollateral);
      expect(result).toBeGreaterThan(0n);
    });
  });

  describe("computeRequiredCollateral - Critical Properties", () => {
    test.prop({
      loanAmount: fc.bigInt({ min: 0n, max: parseUnits("100000", 6) }),
      collateralPrice: fc.bigInt({ min: parseUnits("100", 18), max: parseUnits("5000", 18) }),
      lltv: fc.bigInt({ min: parseUnits("0.5", 18), max: parseUnits("0.9", 18) }),
    })("should never return negative values", ({ loanAmount, collateralPrice, lltv }) => {
      const market = createMockMarket(collateralPrice, lltv);
      const required = computeRequiredCollateral(market, loanAmount);

      expect(required).toBeGreaterThanOrEqual(0n);
    });

    test.prop({
      loanAmount: fc.bigInt({ min: 1000n, max: parseUnits("10000", 6) }),
      collateralPrice: fc.bigInt({ min: parseUnits("100", 18), max: parseUnits("5000", 18) }),
      lltv: fc.bigInt({ min: parseUnits("0.5", 18), max: parseUnits("0.9", 18) }),
    })("should increase with larger loan", ({ loanAmount, collateralPrice, lltv }) => {
      const market = createMockMarket(collateralPrice, lltv);
      const required1 = computeRequiredCollateral(market, loanAmount);
      const required2 = computeRequiredCollateral(market, loanAmount + 1000n);

      expect(required2).toBeGreaterThanOrEqual(required1);
    });

    it("should return 0 when loan amount is 0", () => {
      const market = createMockMarket(parseUnits("1000", 18), parseUnits("0.8", 18));
      const required = computeRequiredCollateral(market, 0n);

      expect(required).toBe(0n);
    });

    it("should handle oracle failure (price = 0) safely", () => {
      const market = createMockMarket(0n, parseUnits("0.8", 18));
      const required = computeRequiredCollateral(market, parseUnits("1000", 6));

      expect(required).toBe(0n);
    });

    it("should handle zero LLTV safely", () => {
      const market = createMockMarket(parseUnits("1000", 18), 0n);
      const required = computeRequiredCollateral(market, parseUnits("1000", 6));

      expect(required).toBe(0n);
    });
  });
});

// Helper to create mock market data
function createMockMarket(collateralPrice: bigint, lltv: bigint): MarketNonIdle {
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
