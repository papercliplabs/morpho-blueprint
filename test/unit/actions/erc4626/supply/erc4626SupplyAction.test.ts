import { parseUnits } from "viem";
import { describe, expect, vi } from "vitest";

import { erc4626SupplyAction } from "@/actions/erc4626/supply/erc4626SupplyAction";
import { erc4626SupplyActionDirect } from "@/actions/erc4626/supply/erc4626SupplyActionDirect";
import { erc4626SupplyViaBundler3Action } from "@/actions/erc4626/supply/erc4626SupplyViaBundler3Action";
import { APP_CONFIG } from "@/config";

import { test } from "../../../../config";

// Mock the underlying action implementations
vi.mock("@/actions/erc4626/supply/erc4626SupplyActionDirect");
vi.mock("@/actions/erc4626/supply/erc4626SupplyViaBundler3Action");

describe("erc4626SupplyAction (wrapper)", () => {
  const vaultAddress = "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB";
  const supplyAmount = parseUnits("1000", 6);

  test("routes to bundler3 implementation when bundler3 is enabled", async ({ client }) => {
    const originalEnabled = APP_CONFIG.actionParameters.bundler3Config.enabled;

    try {
      // Enable bundler3
      // biome-ignore lint/suspicious/noExplicitAny: Needed to override readonly config for testing
      (APP_CONFIG.actionParameters.bundler3Config as any).enabled = true;

      // Setup mock
      const mockResult = {
        transactionRequests: [],
        signatureRequests: [],
        positionChange: { balance: { before: 0n, after: 0n } },
      };
      vi.mocked(erc4626SupplyViaBundler3Action).mockResolvedValue(mockResult);

      // Call wrapper
      await erc4626SupplyAction({
        client,
        vaultAddress,
        accountAddress: client.account.address,
        supplyAmount,
      });

      // Verify bundler3 implementation was called
      expect(erc4626SupplyViaBundler3Action).toHaveBeenCalledWith({
        client,
        vaultAddress,
        accountAddress: client.account.address,
        supplyAmount,
      });
      expect(erc4626SupplyActionDirect).not.toHaveBeenCalled();
    } finally {
      // Restore original config
      // biome-ignore lint/suspicious/noExplicitAny: Needed to restore readonly config after testing
      (APP_CONFIG.actionParameters.bundler3Config as any).enabled = originalEnabled;
      vi.clearAllMocks();
    }
  });

  test("routes to direct implementation when bundler3 is disabled", async ({ client }) => {
    const originalEnabled = APP_CONFIG.actionParameters.bundler3Config.enabled;

    try {
      // Disable bundler3
      // biome-ignore lint/suspicious/noExplicitAny: Needed to override readonly config for testing
      (APP_CONFIG.actionParameters.bundler3Config as any).enabled = false;

      // Setup mock
      const mockResult = {
        transactionRequests: [],
        signatureRequests: [],
        positionChange: { balance: { before: 0n, after: 0n } },
      };
      vi.mocked(erc4626SupplyActionDirect).mockResolvedValue(mockResult);

      // Call wrapper
      await erc4626SupplyAction({
        client,
        vaultAddress,
        accountAddress: client.account.address,
        supplyAmount,
      });

      // Verify direct implementation was called
      expect(erc4626SupplyActionDirect).toHaveBeenCalledWith({
        client,
        vaultAddress,
        accountAddress: client.account.address,
        supplyAmount,
      });
      expect(erc4626SupplyViaBundler3Action).not.toHaveBeenCalled();
    } finally {
      // Restore original config
      // biome-ignore lint/suspicious/noExplicitAny: Needed to restore readonly config after testing
      (APP_CONFIG.actionParameters.bundler3Config as any).enabled = originalEnabled;
      vi.clearAllMocks();
    }
  });
});
