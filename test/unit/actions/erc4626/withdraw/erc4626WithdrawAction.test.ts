import { parseUnits } from "viem";
import { describe, expect, vi } from "vitest";

import { erc4626WithdrawAction } from "@/actions/erc4626/withdraw/erc4626WithdrawAction";
import { erc4626WithdrawActionDirect } from "@/actions/erc4626/withdraw/erc4626WithdrawActionDirect";
import { erc4626WithdrawViaBundler3Action } from "@/actions/erc4626/withdraw/erc4626WithdrawViaBundler3Action";
import { APP_CONFIG } from "@/config";

import { test } from "../../../../config";

// Mock the underlying action implementations
vi.mock("@/actions/erc4626/withdraw/erc4626WithdrawActionDirect");
vi.mock("@/actions/erc4626/withdraw/erc4626WithdrawViaBundler3Action");

describe("erc4626WithdrawAction (wrapper)", () => {
  const vaultAddress = "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB";
  const withdrawAmount = parseUnits("1000", 6);

  test("routes to bundler3 implementation when bundler3 is enabled", async ({ client }) => {
    const originalEnabled = APP_CONFIG.actionParameters.bundler3Config.enabled;

    try {
      // Enable bundler3
      // biome-ignore lint/suspicious/noExplicitAny: Needed to override readonly config for testing
      (APP_CONFIG.actionParameters.bundler3Config as any).enabled = true;

      // Setup mock
      const mockResult = {
        chainId: client.chain.id,
        transactionRequests: [],
        signatureRequests: [],
        positionChange: { balance: { before: 0n, after: 0n } },
      };
      vi.mocked(erc4626WithdrawViaBundler3Action).mockResolvedValue(mockResult);

      // Call wrapper
      await erc4626WithdrawAction({
        client,
        vaultAddress,
        accountAddress: client.account.address,
        withdrawAmount,
      });

      // Verify bundler3 implementation was called
      expect(erc4626WithdrawViaBundler3Action).toHaveBeenCalledWith({
        client,
        vaultAddress,
        accountAddress: client.account.address,
        withdrawAmount,
      });
      expect(erc4626WithdrawActionDirect).not.toHaveBeenCalled();
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
        chainId: client.chain.id,
        transactionRequests: [],
        signatureRequests: [],
        positionChange: { balance: { before: 0n, after: 0n } },
      };
      vi.mocked(erc4626WithdrawActionDirect).mockResolvedValue(mockResult);

      // Call wrapper
      await erc4626WithdrawAction({
        client,
        vaultAddress,
        accountAddress: client.account.address,
        withdrawAmount,
      });

      // Verify direct implementation was called
      expect(erc4626WithdrawActionDirect).toHaveBeenCalledWith({
        client,
        vaultAddress,
        accountAddress: client.account.address,
        withdrawAmount,
      });
      expect(erc4626WithdrawViaBundler3Action).not.toHaveBeenCalled();
    } finally {
      // Restore original config
      // biome-ignore lint/suspicious/noExplicitAny: Needed to restore readonly config after testing
      (APP_CONFIG.actionParameters.bundler3Config as any).enabled = originalEnabled;
      vi.clearAllMocks();
    }
  });
});
