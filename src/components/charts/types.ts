import type { Apy, TokenAmount } from "@/generated/gql/whisk/graphql";

export interface DataEntry {
  bucketTimestamp: number;
  totalSupplied: TokenAmount;
  totalBorrowed: TokenAmount;
  supplyApy: Pick<Apy, "base" | "total">;
}

export interface HistoricalData {
  hourly: DataEntry[];
  daily: DataEntry[];
  weekly: DataEntry[];
}

