// Scalar shims for the Morpho GraphQL API, referenced from codegen.ts.
// These are app-owned: nothing outside the data layer should need to import generated types.

export type { Address, Hex } from "viem";

// `BigInt` scalars come back as a JSON number when the value fits in a safe integer, and as a
// string otherwise. Normalize with `toBigInt` from @/common/data/adapters/amount before use.
export type BigIntish = string | number | bigint;
