import { maxUint256 } from "viem";
import { describe, expect, it } from "vitest";
import { createOnchainAmountSchema, parseOnchainAmount } from "@/utils/schemas";

/**
 * Security-focused tests for schema validation
 * Focus: Prevent DoS, injection, overflow attacks
 */

describe("Schema Security Tests", () => {
  describe("parseOnchainAmount - DoS Prevention", () => {
    it("should handle extremely long numeric strings without hanging", () => {
      const longNumber = "9".repeat(1000);

      const startTime = Date.now();
      const result = parseOnchainAmount(longNumber, 18);
      const duration = Date.now() - startTime;

      // Should complete in under 100ms
      expect(duration).toBeLessThan(100);
      expect(result === null || typeof result === "bigint").toBe(true);
    });

    it("should reject malicious inputs safely", () => {
      const attacks = [
        "'; DROP TABLE users; --", // SQL injection
        "<script>alert('xss')</script>", // XSS
        "\u0000", // Null byte
        "1e99999", // Scientific notation
      ];

      for (const attack of attacks) {
        expect(() => parseOnchainAmount(attack, 18)).not.toThrow();
        const result = parseOnchainAmount(attack, 18);
        expect(result).toBeNull();
      }
    });

    it("should handle empty and whitespace correctly", () => {
      expect(parseOnchainAmount("", 18)).toBe(0n);
      expect(parseOnchainAmount("  ", 18)).toBe(0n);
      // "123" with 18 decimals = 123 * 10^18
      expect(parseOnchainAmount("  123  ", 18)).toBe(123000000000000000000n);
    });
  });

  describe("createOnchainAmountSchema - Bounds Checking", () => {
    it("should enforce minimum bounds", () => {
      const schema = createOnchainAmountSchema({
        decimals: 6,
        min: 100n,
      });

      expect(() => schema.parse("0.000099")).toThrow();
      expect(schema.parse("0.0001")).toBe(100n);
      expect(schema.parse("0.0002")).toBe(200n);
    });

    it("should enforce maximum bounds", () => {
      const schema = createOnchainAmountSchema({
        decimals: 6,
        max: 1000000n,
      });

      expect(schema.parse("1.0")).toBe(1000000n);
      expect(() => schema.parse("1.000001")).toThrow();
    });

    it("should prevent overflow beyond maxUint256", () => {
      const schema = createOnchainAmountSchema({
        decimals: 0,
        max: maxUint256,
      });

      // This is a huge number that exceeds maxUint256
      const hugeNumber = `${maxUint256}9999`;
      expect(() => schema.parse(hugeNumber)).toThrow();
    });

    it("should handle zero correctly when min=0n", () => {
      const schema = createOnchainAmountSchema({
        decimals: 18,
        min: 0n,
      });

      expect(schema.parse("0")).toBe(0n);
      expect(schema.parse("0.0")).toBe(0n);
    });
  });

  describe("Precision Tests", () => {
    it("should maintain exact precision for bigint values", () => {
      const schema = createOnchainAmountSchema({ decimals: 18 });

      // Maximum precision
      const result = schema.parse("0.123456789012345678");
      expect(result).toBe(123456789012345678n);

      // 1 wei
      const oneWei = schema.parse("0.000000000000000001");
      expect(oneWei).toBe(1n);
    });

    it("should handle common DeFi amounts correctly", () => {
      const testCases = [
        { input: "1.0", decimals: 18, expected: 1000000000000000000n },
        { input: "0.5", decimals: 6, expected: 500000n },
        { input: "1000", decimals: 6, expected: 1000000000n },
      ];

      for (const { input, decimals, expected } of testCases) {
        const result = parseOnchainAmount(input, decimals);
        expect(result).toBe(expected);
      }
    });
  });
});
