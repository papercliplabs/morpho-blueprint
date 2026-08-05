import { formatUnits } from "viem";
import type { Amount, Ratio } from "@/common/data/types";
import type { BigIntish } from "@/morpho-types";

/**
 * The API serializes `BigInt` scalars as a JSON number when the value fits in a safe integer, and
 * as a string otherwise, so every read of a BigInt field goes through here.
 */
export function toBigInt(value: BigIntish | null | undefined): bigint {
  if (value == null) return 0n;
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(Math.trunc(value));
  return BigInt(value);
}

/** `Asset.decimals` is a `Float` in the schema; token decimals are always integral. */
export function toDecimals(decimals: number): number {
  return Math.round(decimals);
}

export function descale(value: BigIntish | null | undefined, decimals: number): number {
  return Number(formatUnits(toBigInt(value), toDecimals(decimals)));
}

/**
 * Whisk served money as a `{raw, formatted, usd}` triple; Morpho serves a raw `BigInt` plus a
 * parallel `...Usd: Float`. This rebuilds the triple, deriving `formatted` from raw + decimals.
 */
export function toAmount(raw: BigIntish | null | undefined, decimals: number, usd?: number | null): Amount {
  const rawBigInt = toBigInt(raw);
  return {
    raw: rawBigInt.toString(),
    formatted: formatUnits(rawBigInt, toDecimals(decimals)),
    usd: usd ?? null,
  };
}

/**
 * Same as `toAmount`, but prices the amount client-side when the API exposes no parallel USD field.
 */
export function toAmountWithPrice(
  raw: BigIntish | null | undefined,
  decimals: number,
  priceUsd: number | null | undefined,
): Amount {
  const amount = toAmount(raw, decimals);
  return { ...amount, usd: priceUsd == null ? null : Number(amount.formatted) * priceUsd };
}

/** A WAD-scaled unitless ratio (LLTV, LTV, relative caps) as `{raw, formatted}`. */
export function toRatio(raw: BigIntish | null | undefined): Ratio {
  const rawBigInt = toBigInt(raw);
  return { raw: rawBigInt.toString(), formatted: formatUnits(rawBigInt, 18) };
}
