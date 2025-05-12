import { formatUnits } from "viem";

export function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Avoid scientific notation for large or small entries
export function numberToString(value: number) {
  return new Intl.NumberFormat("en-US", {
    useGrouping: false,
    maximumFractionDigits: 20,
    minimumFractionDigits: 0,
  }).format(value);
}

export function descaleBigIntToNumber(value: bigint | string, decimals: number): number {
  const formattedUnits = formatUnits(BigInt(value), decimals);
  return Math.floor(Number(formattedUnits) * 1e8) / 1e8; // Round down to 8 decimal places for precision
}
