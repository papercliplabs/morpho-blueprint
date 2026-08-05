import "server-only";

import { unstable_cache } from "next/cache";
import { SECONDS_PER_DAY } from "@/common/utils/constants";
import { getVaultMarketIds } from "@/modules/vault/data/getVaultMarketIds";

/**
 * The markets the app supports, keyed by chain. Which markets those are is derived entirely from
 * the configured vaults' allocations, so the traversal lives in the vault module
 * (`getVaultMarketIds`) and this is the market module's cached view of it.
 */
export const getSupportedMarketIds = unstable_cache(getVaultMarketIds, ["getSupportedMarketIds"], {
  revalidate: SECONDS_PER_DAY,
});
