import type { Apy, TokenAmount } from "@/generated/gql/whisk/graphql";
import type { DataEntry, HistoricalData } from "./types";


// Helper function to generate realistic TokenAmount
function createTokenAmount(baseValue: number, variance = 0.1): {
  raw: string;
  formatted: string;
  usd: number;
} {
  const usdValue = baseValue * (1 + (Math.random() - 0.5) * variance);
  const rawValue = baseValue * (0.24 + (Math.random() + 0.24) * variance);
  
  return {
    raw: rawValue.toString(),
    formatted: rawValue.toFixed(6),
    usd: usdValue
  };
}

// Helper function to generate random market events
function generateRandomEvent(): number {
  // Random chance of significant market events
  if (Math.random() < 0.02) { // 2% chance per data point
    return (Math.random() - 0.5) * 0.3; // ±15% swing
  }
  return 0;
}

// Generate hourly data (200 hours ago to now)
const hourlyData = Array.from({ length: 200 }, (_, i) => {
  const timestamp = Date.now() - (199 - i) * 60 * 60 * 1000; // 1 hour intervals
  const progress = i / 199;
  
  // More random growth with multiple overlapping patterns
  const randomWalk = Math.random() * 0.2 - 0.1; // Random walk component
  const marketEvent = generateRandomEvent();
  const multiWave = Math.sin(progress * Math.PI * 3) * 0.15 + Math.cos(progress * Math.PI * 7) * 0.08;
  
  const growthFactor = 1 + progress * 0.8 + randomWalk + marketEvent + multiWave;
  const baseSupplied = (800000 + Math.random() * 400000) * growthFactor;
  const baseBorrowed = (400000 + Math.random() * 300000) * growthFactor * (0.6 + Math.random() * 0.3);
  
  return {
    bucketTimestamp: Math.floor(timestamp / 1000),
    totalSupplied: createTokenAmount(baseSupplied, 0.15), // Increased variance
    totalBorrowed: createTokenAmount(baseBorrowed, 0.2),
    supplyApy: {
      base: Math.min(0.25, Math.max(0.01, 0.05 + Math.random() * 0.08 + Math.sin(progress * Math.PI * 5) * 0.03)), 
      total: Math.min(0.25, Math.max(0.01, 0.07 + Math.random() * 0.10 + Math.cos(progress * Math.PI * 6) * 0.04))
    }
  };
});

// Generate daily data (200 days ago to now)
const dailyData = Array.from({ length: 200 }, (_, i) => {
  const timestamp = Date.now() - (200 - i) * 24 * 60 * 60 * 1000; // 1 day intervals
  const progress = i / 200;
  
  // Volatile long-term trends with random shocks
  const trendNoise = (Math.random() - 0.5) * 0.4; // Random trend deviation
  const volatilitySpike = Math.random() < 0.05 ? (Math.random() - 0.5) * 0.6 : 0; // 5% chance of big moves
  const cyclicalPattern = Math.sin(progress * Math.PI * 2.3) * 0.2 + Math.sin(progress * Math.PI * 0.7) * 0.1;
  
  const growthMultiplier = 1 + progress * 1.5 + trendNoise + volatilitySpike + cyclicalPattern;
  const baseSupplied = (600000 + Math.random() * 600000) * growthMultiplier;
  const baseBorrowed = (300000 + Math.random() * 400000) * growthMultiplier * (0.5 + Math.random() * 0.4);
  
  return {
    bucketTimestamp: Math.floor(timestamp / 1000),
    totalSupplied: createTokenAmount(baseSupplied, 0.25), // Higher variance for daily
    totalBorrowed: createTokenAmount(baseBorrowed, 0.3),
    supplyApy: {
      base: Math.min(0.25, Math.max(0.01, 0.04 + Math.random() * 0.12 + Math.sin(progress * Math.PI * 3.7) * 0.04)),
      total: Math.min(0.25, Math.max(0.01, 0.06 + Math.random() * 0.14 + Math.cos(progress * Math.PI * 4.1) * 0.05))
    }
  };
});

// Generate weekly data (200 weeks ago to now)
const weeklyData = Array.from({ length: 200 }, (_, i) => {
  const timestamp = Date.now() - (200 - i) * 7 * 24 * 60 * 60 * 1000; // 1 week intervals
  const progress = i / 200;
  
  // Long-term with major market cycles and random disruptions
  const marketCrash = progress > 0.3 && progress < 0.45 ? -0.4 : 0; // Simulated crash period
  const marketBoom = progress > 0.7 && progress < 0.85 ? 0.6 : 0; // Simulated boom
  const randomShock = Math.random() < 0.03 ? (Math.random() - 0.5) * 0.8 : 0; // 3% chance of major events
  const longCycle = Math.sin(progress * Math.PI * 1.3) * 0.3;
  const mediumCycle = Math.cos(progress * Math.PI * 3.1) * 0.15;
  
  const totalMultiplier = 1 + progress * 2 + marketCrash + marketBoom + randomShock + longCycle + mediumCycle;
  const baseSupplied = (400000 + Math.random() * 800000) * Math.max(0.2, totalMultiplier);
  const baseBorrowed = (150000 + Math.random() * 500000) * Math.max(0.1, totalMultiplier) * (0.4 + Math.random() * 0.5);
  
  return {
    bucketTimestamp: Math.floor(timestamp / 1000),
    totalSupplied: createTokenAmount(baseSupplied, 0.35), // Highest variance for weekly
    totalBorrowed: createTokenAmount(baseBorrowed, 0.4),
    supplyApy: {
      base: Math.min(0.25, Math.max(0.01, 0.06 + Math.random() * 0.10 + Math.sin(progress * Math.PI * 2.7) * 0.03 + marketCrash * 0.05)),
      total: Math.min(0.25, Math.max(0.01, 0.08 + Math.random() * 0.12 + Math.cos(progress * Math.PI * 3.3) * 0.04 + marketBoom * 0.03))
    }
  };
});

type SampleDepositData = DataEntry & {
  totalSupplied: TokenAmount;
  totalBorrowed: TokenAmount;
}

type SampleApyData = DataEntry & {
  supplyApy: Pick<Apy, "base" | "total">;
}

export const sampleDespositsData: HistoricalData<SampleDepositData> = {
  hourly: hourlyData,
  daily: dailyData,
  weekly: weeklyData,
} as const;

export const sampleApyData: HistoricalData<SampleApyData> = {
  hourly: hourlyData,
  daily: dailyData,
  weekly: weeklyData,
} as const;

// Sample data with limited history (for testing new vaults)
const limitedHourlyData = Array.from({ length: 24 }, (_, i) => {
  const timestamp = Date.now() - (23 - i) * 60 * 60 * 1000; // Only last 24 hours
  const progress = i / 23;
  
  const randomWalk = Math.random() * 0.1 - 0.05;
  const growthFactor = 1 + progress * 0.2 + randomWalk;
  const baseSupplied = (50000 + Math.random() * 25000) * growthFactor;
  const baseBorrowed = (20000 + Math.random() * 15000) * growthFactor * (0.5 + Math.random() * 0.3);
  
  return {
    bucketTimestamp: Math.floor(timestamp / 1000),
    totalSupplied: createTokenAmount(baseSupplied, 0.1),
    totalBorrowed: createTokenAmount(baseBorrowed, 0.15),
    supplyApy: {
      base: Math.min(0.15, Math.max(0.02, 0.06 + Math.random() * 0.04)), 
      total: Math.min(0.15, Math.max(0.02, 0.08 + Math.random() * 0.05))
    }
  };
});

const limitedDailyData = Array.from({ length: 5 }, (_, i) => {
  const timestamp = Date.now() - (4 - i) * 24 * 60 * 60 * 1000; // Only last 5 days
  const progress = i / 4;
  
  const trendNoise = (Math.random() - 0.5) * 0.2;
  const growthMultiplier = 1 + progress * 0.4 + trendNoise;
  const baseSupplied = (75000 + Math.random() * 50000) * growthMultiplier;
  const baseBorrowed = (30000 + Math.random() * 25000) * growthMultiplier * (0.4 + Math.random() * 0.4);
  
  return {
    bucketTimestamp: Math.floor(timestamp / 1000),
    totalSupplied: createTokenAmount(baseSupplied, 0.2),
    totalBorrowed: createTokenAmount(baseBorrowed, 0.25),
    supplyApy: {
      base: Math.min(0.2, Math.max(0.01, 0.05 + Math.random() * 0.06)),
      total: Math.min(0.2, Math.max(0.01, 0.07 + Math.random() * 0.08))
    }
  };
});

const limitedWeeklyData = Array.from({ length: 3 }, (_, i) => {
  const timestamp = Date.now() - (2 - i) * 7 * 24 * 60 * 60 * 1000; // Only last 3 weeks
  const progress = i / 2;
  
  const randomShock = Math.random() < 0.1 ? (Math.random() - 0.5) * 0.3 : 0;
  const totalMultiplier = 1 + progress * 0.6 + randomShock;
  const baseSupplied = (100000 + Math.random() * 75000) * Math.max(0.3, totalMultiplier);
  const baseBorrowed = (40000 + Math.random() * 35000) * Math.max(0.2, totalMultiplier) * (0.3 + Math.random() * 0.5);
  
  return {
    bucketTimestamp: Math.floor(timestamp / 1000),
    totalSupplied: createTokenAmount(baseSupplied, 0.3),
    totalBorrowed: createTokenAmount(baseBorrowed, 0.35),
    supplyApy: {
      base: Math.min(0.2, Math.max(0.02, 0.07 + Math.random() * 0.05)),
      total: Math.min(0.2, Math.max(0.02, 0.09 + Math.random() * 0.06))
    }
  };
});

// Limited sample data for testing new vaults with minimal history
export const limitedDepositData: HistoricalData<SampleDepositData> = {
  hourly: limitedHourlyData,
  daily: limitedDailyData,
  weekly: limitedWeeklyData,
} as const;

export const limitedApyData: HistoricalData<SampleApyData> = {
  hourly: limitedHourlyData,
  daily: limitedDailyData, 
  weekly: limitedWeeklyData,
} as const;