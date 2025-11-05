import { type Address, getAddress } from "viem";
import { mainnet } from "viem/chains";
import type { SupportedChainId } from "@/config/types";

// Tokens that require approval to be reset to 0 before setting a new approval amount.
// This is required for non-ERC20 compliant tokens like USDT and CRV which will otherwise revert on approve.
export const TOKENS_REQUIRING_APPROVAL_REVOCATION: Partial<Record<SupportedChainId, Record<Address, boolean>>> = {
  [mainnet.id]: {
    [getAddress("0xdAC17F958D2ee523a2206206994597C13D831ec7")]: true, // USDT
    [getAddress("0xD533a949740bb3306d119CC777fa900bA034cd52")]: true, // CRV
  },
};
