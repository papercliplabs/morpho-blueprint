import type { Erc4626WithdrawActionParameters, VaultAction } from "@/actions/types";
import { APP_CONFIG } from "@/config";
import { erc4626WithdrawActionDirect } from "./erc4626WithdrawActionDirect";
import { erc4626WithdrawViaBundler3Action } from "./erc4626WithdrawViaBundler3Action";

/**
 * Action to withdraw from an ERC4626 vault.
 * This is just a convenience wrapper to direct to the appropriate withdraw action based on the configuration (bundler3 or direct).
 *
 * See the docstring for each action for more details.
 */
export async function erc4626WithdrawAction(params: Erc4626WithdrawActionParameters): Promise<VaultAction> {
  if (APP_CONFIG.actionParameters.bundler3Config.enabled) {
    return erc4626WithdrawViaBundler3Action(params);
  }

  return erc4626WithdrawActionDirect(params);
}
