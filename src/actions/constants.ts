import { parseUnits } from "viem";

export const MAX_ABSOLUTE_SHARE_PRICE_RAY = parseUnits("100", 27);

export const SHARE_SANITY_TOLERANCE_WAD = parseUnits("0.01", 18); // 1%
