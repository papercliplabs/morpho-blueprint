import type { Hex } from "viem";
import type { SupportedChainId } from "@/config/types";

export interface MarketIdentifier {
  chainId: SupportedChainId;
  marketId: Hex;
}
