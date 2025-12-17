import { parseUnits } from "viem";
import { describe, expect, it } from "vitest";
import { createVaultSupplyFormSchema } from "@/modules/vault/components/VaultSupplyForm/schema";
import { createVaultWithdrawFormSchema } from "@/modules/vault/components/VaultWithdrawForm/schema";
import type { Vault } from "@/modules/vault/data/getVault";

/**
 * Security tests for vault form validation schemas
 * Focus: Balance validation, native asset wrapping
 */

describe("Vault Form Schema Tests", () => {
  describe("VaultSupplyFormSchema", () => {
    describe("Basic balance validation (non-WETH vault)", () => {
      it("should enforce balance limits", () => {
        const vault = createMockVault({ decimals: 6 });
        const accountLoanTokenBalance = parseUnits("100", 6);
        const accountNativeAssetBalance = parseUnits("0", 18); // Provide value even if not used
        const maxFeePerGas = parseUnits("50", 9); // Provide value for validation to work

        const schema = createVaultSupplyFormSchema(
          vault,
          accountLoanTokenBalance,
          accountNativeAssetBalance,
          maxFeePerGas,
        );

        expect(schema.parse({ supplyAmount: "100", allowNativeAssetWrapping: false }).supplyAmount).toBe(100000000n);
        expect(() => schema.parse({ supplyAmount: "100.000001", allowNativeAssetWrapping: false })).toThrow(
          "Amount exceeds balance.",
        );
      });

      it("should allow supply up to exact balance", () => {
        const vault = createMockVault({ decimals: 6 });
        const accountLoanTokenBalance = parseUnits("100", 6);
        const accountNativeAssetBalance = undefined;
        const maxFeePerGas = parseUnits("50", 9); // Provide value for validation to work

        const schema = createVaultSupplyFormSchema(
          vault,
          accountLoanTokenBalance,
          accountNativeAssetBalance,
          maxFeePerGas,
        );

        const result = schema.parse({ supplyAmount: "100", allowNativeAssetWrapping: false });
        expect(result.supplyAmount).toBe(accountLoanTokenBalance);
      });

      it("should work without balance (no max limit)", () => {
        const vault = createMockVault({ decimals: 6 });
        const accountLoanTokenBalance = undefined;
        const accountNativeAssetBalance = undefined;
        const maxFeePerGas = undefined;

        const schema = createVaultSupplyFormSchema(
          vault,
          accountLoanTokenBalance,
          accountNativeAssetBalance,
          maxFeePerGas,
        );

        const result = schema.parse({ supplyAmount: "1000000", allowNativeAssetWrapping: false });
        expect(result.supplyAmount).toBeGreaterThan(0n);
      });
    });

    describe("Native asset wrapping (WETH vault)", () => {
      const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

      it("should not allow wrapping when vault is not WETH", () => {
        const vault = createMockVault({ decimals: 6, address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" }); // USDC
        const accountLoanTokenBalance = parseUnits("10", 6);
        const accountNativeAssetBalance = parseUnits("100", 18);
        const maxFeePerGas = parseUnits("50", 9);

        const schema = createVaultSupplyFormSchema(
          vault,
          accountLoanTokenBalance,
          accountNativeAssetBalance,
          maxFeePerGas,
        );

        // Even with allowNativeAssetWrapping=true and all params provided, should only use loan token balance
        expect(() => schema.parse({ supplyAmount: "20", allowNativeAssetWrapping: true })).toThrow(
          "Amount exceeds balance.",
        );
      });

      it("should enforce loan token balance limit when wrapping is disabled", () => {
        const vault = createMockVault({ decimals: 18, address: WETH_ADDRESS });
        const accountLoanTokenBalance = parseUnits("1", 18); // 1 WETH
        const accountNativeAssetBalance = parseUnits("10", 18); // 10 ETH
        const maxFeePerGas = parseUnits("50", 9); // Provide value for validation to work

        const schema = createVaultSupplyFormSchema(
          vault,
          accountLoanTokenBalance,
          accountNativeAssetBalance,
          maxFeePerGas,
        );

        // With wrapping disabled, should only allow up to 1 WETH
        const result = schema.parse({ supplyAmount: "1", allowNativeAssetWrapping: false });
        expect(result.supplyAmount).toBe(parseUnits("1", 18));

        expect(() => schema.parse({ supplyAmount: "2", allowNativeAssetWrapping: false })).toThrow(
          "Amount exceeds balance.",
        );
      });

      it("should allow supply using combined balance when wrapping is enabled", () => {
        const vault = createMockVault({ decimals: 18, address: WETH_ADDRESS });
        const accountLoanTokenBalance = parseUnits("1", 18); // 1 WETH
        const accountNativeAssetBalance = parseUnits("10", 18); // 10 ETH
        const maxFeePerGas = parseUnits("50", 9); // 50 gwei

        const schema = createVaultSupplyFormSchema(
          vault,
          accountLoanTokenBalance,
          accountNativeAssetBalance,
          maxFeePerGas,
        );

        // With wrapping enabled, should allow supply beyond just WETH balance
        const result = schema.parse({ supplyAmount: "5", allowNativeAssetWrapping: true });
        expect(result.supplyAmount).toBe(parseUnits("5", 18));
      });

      it("should account for gas reserve when calculating available balance", () => {
        const vault = createMockVault({ decimals: 18, address: WETH_ADDRESS });
        const accountLoanTokenBalance = parseUnits("1", 18); // 1 WETH
        const accountNativeAssetBalance = parseUnits("2", 18); // 2 ETH
        const maxFeePerGas = parseUnits("100", 9); // 100 gwei

        const schema = createVaultSupplyFormSchema(
          vault,
          accountLoanTokenBalance,
          accountNativeAssetBalance,
          maxFeePerGas,
        );

        // Should allow supply up to WETH + (ETH - gas reserve)
        // Gas reserve = 1,000,000 * 100 gwei = 0.1 ETH
        // Available = 1 WETH + (2 - 0.1) = 2.9 WETH
        const result = schema.parse({ supplyAmount: "2.9", allowNativeAssetWrapping: true });
        expect(result.supplyAmount).toBe(parseUnits("2.9", 18));

        // Should reject if exceeds combined balance
        expect(() => schema.parse({ supplyAmount: "2.91", allowNativeAssetWrapping: true })).toThrow(
          "Amount exceeds balance",
        );
      });

      it("should handle wrapping when loan token balance is zero", () => {
        const vault = createMockVault({ decimals: 18, address: WETH_ADDRESS });
        const accountLoanTokenBalance = parseUnits("0", 18); // 0 WETH
        const accountNativeAssetBalance = parseUnits("5", 18); // 5 ETH
        const maxFeePerGas = parseUnits("50", 9); // 50 gwei

        const schema = createVaultSupplyFormSchema(
          vault,
          accountLoanTokenBalance,
          accountNativeAssetBalance,
          maxFeePerGas,
        );

        // Should allow supply using only native asset balance (minus gas reserve)
        const result = schema.parse({ supplyAmount: "4.9", allowNativeAssetWrapping: true });
        expect(result.supplyAmount).toBe(parseUnits("4.9", 18));
      });

      it("should not validate when missing wrapping params", () => {
        const vault = createMockVault({ decimals: 18, address: WETH_ADDRESS });
        const accountLoanTokenBalance = parseUnits("1", 18); // 1 WETH
        const accountNativeAssetBalance = parseUnits("10", 18); // 10 ETH

        const schema = createVaultSupplyFormSchema(
          vault,
          accountLoanTokenBalance,
          accountNativeAssetBalance,
          undefined,
        );

        // Without maxFeePerGas, no validation occurs (prevents loading glitch)
        const result = schema.parse({ supplyAmount: "100", allowNativeAssetWrapping: true });
        expect(result.supplyAmount).toBe(parseUnits("100", 18));
      });

      it("should not validate when native balance is unavailable", () => {
        const vault = createMockVault({ decimals: 18, address: WETH_ADDRESS });
        const accountLoanTokenBalance = parseUnits("1", 18); // 1 WETH
        const maxFeePerGas = parseUnits("50", 9);

        const schema = createVaultSupplyFormSchema(vault, accountLoanTokenBalance, undefined, maxFeePerGas);

        // Without accountNativeAssetBalance, no validation occurs (prevents loading glitch)
        const result = schema.parse({ supplyAmount: "100", allowNativeAssetWrapping: true });
        expect(result.supplyAmount).toBe(parseUnits("100", 18));
      });

      it("should clamp native contribution when balance is below the gas reserve", () => {
        const vault = createMockVault({ decimals: 18, address: WETH_ADDRESS });
        const accountLoanTokenBalance = parseUnits("1", 18); // 1 WETH
        const accountNativeAssetBalance = parseUnits("0.04", 18); // 0.04 ETH
        const maxFeePerGas = parseUnits("50", 9); // 50 gwei => 0.05 ETH reserve

        const schema = createVaultSupplyFormSchema(
          vault,
          accountLoanTokenBalance,
          accountNativeAssetBalance,
          maxFeePerGas,
        );

        const withinLimit = schema.parse({ supplyAmount: "1", allowNativeAssetWrapping: true });
        expect(withinLimit.supplyAmount).toBe(parseUnits("1", 18));

        expect(() => schema.parse({ supplyAmount: "1.000000000000000001", allowNativeAssetWrapping: true })).toThrow(
          "Amount exceeds balance.",
        );
      });

      it("should not enforce balance limit when loan token balance is unknown", () => {
        const vault = createMockVault({ decimals: 18, address: WETH_ADDRESS });
        const accountNativeAssetBalance = parseUnits("2", 18); // 2 ETH
        const maxFeePerGas = parseUnits("50", 9); // 50 gwei => 0.05 ETH reserve

        const schema = createVaultSupplyFormSchema(vault, undefined, accountNativeAssetBalance, maxFeePerGas);

        const result = schema.parse({ supplyAmount: "100", allowNativeAssetWrapping: true });
        expect(result.supplyAmount).toBe(parseUnits("100", 18));
      });

      it("should enforce combined balance limit with low native balance", () => {
        const vault = createMockVault({ decimals: 18, address: WETH_ADDRESS });
        const accountLoanTokenBalance = parseUnits("1", 18); // 1 WETH
        const accountNativeAssetBalance = parseUnits("0.5", 18); // 0.5 ETH
        const maxFeePerGas = parseUnits("50", 9);

        const schema = createVaultSupplyFormSchema(
          vault,
          accountLoanTokenBalance,
          accountNativeAssetBalance,
          maxFeePerGas,
        );

        // Total available ~1.449 WETH (1 + 0.5 - 0.05 gas reserve)
        expect(() => schema.parse({ supplyAmount: "2", allowNativeAssetWrapping: true })).toThrow(
          "Amount exceeds balance.",
        );
      });
    });
  });

  describe("VaultWithdrawFormSchema", () => {
    it("should enforce position balance limits", () => {
      const positionBalance = parseUnits("50", 6);
      const schema = createVaultWithdrawFormSchema(6, positionBalance);

      expect(
        schema.parse({ withdrawAmount: "50", isMaxWithdraw: false, unwrapNativeAssets: false }).withdrawAmount,
      ).toBe(50000000n);
      expect(() =>
        schema.parse({ withdrawAmount: "50.000001", isMaxWithdraw: false, unwrapNativeAssets: false }),
      ).toThrow("Amount exceeds position.");
    });

    it("should allow withdrawal up to exact position balance", () => {
      const positionBalance = parseUnits("100", 6);
      const schema = createVaultWithdrawFormSchema(6, positionBalance);

      const result = schema.parse({ withdrawAmount: "100", isMaxWithdraw: false, unwrapNativeAssets: false });
      expect(result.withdrawAmount).toBe(positionBalance);
    });

    it("should work without position (no max limit)", () => {
      const schema = createVaultWithdrawFormSchema(6, undefined);

      const result = schema.parse({ withdrawAmount: "1000000", isMaxWithdraw: false, unwrapNativeAssets: false });
      expect(result.withdrawAmount).toBeGreaterThan(0n);
    });
  });
});

function createMockVault({
  decimals,
  chainId = 1,
  address = "0x0000000000000000000000000000000000000000",
}: {
  decimals: number;
  chainId?: number;
  address?: string;
}): Vault {
  return {
    chain: {
      id: chainId,
    },
    asset: {
      decimals,
      address,
    },
  } as Vault;
}
