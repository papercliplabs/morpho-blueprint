export type DataEntry = {
  bucketTimestamp: number;
};

export interface HistoricalData<T extends DataEntry> {
  hourly: T[];
  daily: T[];
  weekly: T[];
}
