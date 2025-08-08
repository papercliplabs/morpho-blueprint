import { type Address, formatUnits, getAddress } from "viem";
import { APP_CONFIG } from "@/config";

const MAX_USD_VALUE = 1e12;

export function formatNumber(
  value: number,
  options: Intl.NumberFormatOptions & {
    currency?: "USD" | "ETH";
  } = {},
) {
  const currency = options.currency;
  const isPercent = options.style === "percent";
  const {
    notation = "compact",
    minimumFractionDigits = 2,
    maximumFractionDigits = value < 1 && currency !== "USD" && !isPercent ? 3 : 2,
    style,
    ...restOptions
  } = options;

  const displayValue = style === "percent" ? value * 100 : value;
  const formatOptions: Intl.NumberFormatOptions = {
    notation: notation === "compact" && (displayValue > 9999 || displayValue < -9999) ? "compact" : "standard",
    minimumFractionDigits,
    maximumFractionDigits,
    style,
    ...restOptions,
  };

  let prefix = currency === "USD" ? "$" : currency === "ETH" ? "Ξ" : "";

  // Clamp to max USD value
  if (currency === "USD" && value > MAX_USD_VALUE) {
    value = MAX_USD_VALUE;
    prefix = `>${prefix}`;
  }

  const minValue = 10 ** -maximumFractionDigits;
  if (value !== 0 && Math.abs(displayValue) < minValue) {
    const neg = value < 0;
    prefix = neg ? ">" : `<${prefix}`;
    value = minValue * 10 ** (style === "percent" ? -2 : 0) * (neg ? -1 : 1);
  }

  const formatted = new Intl.NumberFormat("en-US", formatOptions).format(value);

  return `${prefix}${formatted}`;
}

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

export function formatAddress(address: Address) {
  const meta = getKnownAddressMeta(address);
  if (meta?.name) return meta.name;
  const checksummed = getAddress(address);
  return `${checksummed.slice(0, 4)}...${checksummed.slice(-4)}`;
}

export function getKnownAddressMeta(address: Address) {
  const checksummed = getAddress(address);
  return APP_CONFIG.knownAddresses[checksummed];
}
