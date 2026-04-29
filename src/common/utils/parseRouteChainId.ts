import { SUPPORTED_CHAIN_IDS } from "@/config";
import type { SupportedChainId } from "@/config/types";

export function parseRouteChainIdParam(chainIdString: string | undefined | null): SupportedChainId | undefined {
  if (chainIdString == null || chainIdString === "") {
    return undefined;
  }
  if (!/^\d+$/.test(chainIdString)) {
    return undefined;
  }
  const id = Number(chainIdString);
  if (!Number.isSafeInteger(id)) {
    return undefined;
  }
  if (!SUPPORTED_CHAIN_IDS.includes(id as SupportedChainId)) {
    return undefined;
  }
  return id as SupportedChainId;
}
