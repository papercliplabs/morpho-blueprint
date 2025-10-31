import type { Erc4626SupplyActionParameters, VaultAction } from "@/actions/types";
import { APP_CONFIG } from "@/config";
import { erc4626SupplyActionDirect } from "./erc4626SupplyActionDirect";
import { erc4626SupplyViaBundler3Action } from "./erc4626SupplyViaBundler3Action";

/**
 * Action to supply to an ERC4626 vault.
 * This is just a convenience wrapper to direct to the appropriate supply action based on the configuration (bundler3 or direct).
 *
 * See the docstring for each action for more details.
 */
export async function erc4626SupplyAction({
  client,
  vaultAddress,
  accountAddress,
  supplyAmount,
}: Erc4626SupplyActionParameters & { enableSlippageProtection?: boolean }): Promise<VaultAction> {
  if (APP_CONFIG.actionParameters.bundler3Config.enabled) {
    return erc4626SupplyViaBundler3Action({ client, vaultAddress, accountAddress, supplyAmount });
  }

  return erc4626SupplyActionDirect({ client, vaultAddress, accountAddress, supplyAmount });
}
