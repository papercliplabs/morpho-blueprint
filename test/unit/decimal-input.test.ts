import { describe, expect, it } from "vitest";
import { validateDecimalInput } from "@/components/ui/decimal-input/validateDecimalInput";

/**
 * Security tests for DecimalInput validation
 * Focus: ReDoS prevention, injection attacks, DoS protection
 */

describe("DecimalInput Security Tests", () => {
  describe("ReDoS Protection", () => {
    it("should handle long numeric strings quickly", () => {
      const longInput = "9".repeat(10000);

      const startTime = Date.now();
      const result = validateDecimalInput(longInput, 18);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(50);
      expect(result.isValid).toBe(true);
    });

    it("should handle many leading zeros efficiently", () => {
      const manyZeros = `${"0".repeat(1000)}.5`;

      const startTime = Date.now();
      const result = validateDecimalInput(manyZeros, 18);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(50);
      expect(result.isValid).toBe(true);
    });
  });

  describe("Decimal Precision Validation", () => {
    it("should enforce decimal limits correctly", () => {
      expect(validateDecimalInput("1.123456", 6).isValid).toBe(true);
      expect(validateDecimalInput("1.1234567", 6).isValid).toBe(false);
    });

    it("should handle zero decimals (integers only)", () => {
      expect(validateDecimalInput("123", 0).isValid).toBe(true);
      expect(validateDecimalInput("123.0", 0).isValid).toBe(false);
    });

    it("should handle maximum precision (18 decimals)", () => {
      expect(validateDecimalInput("1.123456789012345678", 18).isValid).toBe(true);
      expect(validateDecimalInput("1.1234567890123456789", 18).isValid).toBe(false);
    });
  });

  describe("Injection Attack Prevention", () => {
    it("should reject SQL injection attempts", () => {
      const attacks = ["'; DROP TABLE users; --", "1' OR '1'='1", "1; DELETE FROM balances; --"];

      for (const attack of attacks) {
        expect(validateDecimalInput(attack, 18).isValid).toBe(false);
      }
    });

    it("should reject script injection attempts", () => {
      // biome-ignore lint/suspicious/noTemplateCurlyInString: testing
      const attacks = ["<script>alert('xss')</script>", "javascript:alert(1)", "${alert(1)}"];

      for (const attack of attacks) {
        expect(validateDecimalInput(attack, 18).isValid).toBe(false);
      }
    });

    it("should reject path traversal attempts", () => {
      const attacks = ["../../../etc/passwd", "..\\..\\..\\windows\\system32"];

      for (const attack of attacks) {
        expect(validateDecimalInput(attack, 18).isValid).toBe(false);
      }
    });
  });

  describe("Unicode Attack Prevention", () => {
    it("should reject full-width digits", () => {
      const unicodeDigits = ["１２３", "۱۲۳", "१२३"];

      for (const input of unicodeDigits) {
        expect(validateDecimalInput(input, 18).isValid).toBe(false);
      }
    });

    it("should reject unicode control characters", () => {
      const controlChars = ["\u0000123", "123\u200e", "\ufeff123"];

      for (const input of controlChars) {
        expect(validateDecimalInput(input, 18).isValid).toBe(false);
      }
    });

    it("should reject emoji", () => {
      const emojiInputs = ["🔢", "1💯2", "123🎯"];

      for (const input of emojiInputs) {
        expect(validateDecimalInput(input, 18).isValid).toBe(false);
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty string", () => {
      const result = validateDecimalInput("", 18);
      expect(result.isValid).toBe(true);
      expect(result.value).toBe("");
    });

    it("should normalize single dot to '0.'", () => {
      const result = validateDecimalInput(".", 18);
      expect(result.isValid).toBe(true);
      expect(result.value).toBe("0.");
    });

    it("should reject negative numbers", () => {
      expect(validateDecimalInput("-1", 18).isValid).toBe(false);
      expect(validateDecimalInput("-0.5", 18).isValid).toBe(false);
    });

    it("should reject multiple decimal points", () => {
      expect(validateDecimalInput("12.34.56", 18).isValid).toBe(false);
    });

    it("should handle very small numbers", () => {
      expect(validateDecimalInput("0.000000000000000001", 18).isValid).toBe(true);
    });

    it("should handle very large numbers", () => {
      expect(validateDecimalInput("999999999999999999", 18).isValid).toBe(true);
    });
  });

  describe("Normalization", () => {
    it("should normalize only the dot edge case", () => {
      expect(validateDecimalInput(".", 18).value).toBe("0.");
      expect(validateDecimalInput("123", 18).value).toBe("123");
      expect(validateDecimalInput("0.5", 18).value).toBe("0.5");
    });
  });
});
