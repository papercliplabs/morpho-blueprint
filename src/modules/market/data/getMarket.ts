import "server-only";

import { cache } from "react";
import { getAddress, type Hex } from "viem";
import { toAmount } from "@/common/data/adapters/amount";
import { HISTORY_RANGE_KEYS, historyOptions } from "@/common/data/adapters/timeseries";
import { executeMorphoQuery } from "@/common/utils/executeMorphoQuery";
import type { SupportedChainId } from "@/config/types";
import { graphql } from "@/generated/gql/morpho";
import type { Market, MarketNonIdle } from "@/modules/market/market.types";
// The supplying vault V2s' caps and adapters are vault V2 collections, sized by that module's page policy.
import { CAPS_PAGE_SIZE, POSITIONS_PAGE_SIZE, SUPPLIER_ADAPTERS_PAGE_SIZE } from "@/modules/vault/data/pagination";
import {
  ADAPTIVE_CURVE_IRM_TARGET_UTILIZATION,
  computeLiquidationPenalty,
  sumPublicAllocatorSharedLiquidity,
  toCollateralPriceInLoanAsset,
  toMarketHistoricalEntries,
  toMarketSummary,
  toMarketVaultAllocations,
} from "./adapters";

const query = graphql(`
  query Market($chainId: Int!, $marketId: String!, $capsFirst: Int!, $adaptersFirst: Int!, $positionsFirst: Int!) {
    markets(first: 1, where: { chainId_in: [$chainId], uniqueKey_in: [$marketId] }) {
      items {
        ...MarketSummaryFragment

        irmAddress
        oracle {
          address
        }
        currentIrmCurve(numberOfPoints: 100) {
          utilization
          supplyApy
          borrowApy
        }
        publicAllocatorSharedLiquidity {
          assets
        }
        collateralAsset {
          price {
            usd
          }
        }
        loanAsset {
          price {
            usd
          }
        }
        state {
          supplyAssets
          supplyAssetsUsd
          liquidityAssets
          liquidityAssetsUsd
          utilization
          price
        }
        supplyingVaults {
          ...MarketSupplyingVaultV1Fragment
        }
        supplyingVaultV2s {
          ...MarketSupplyingVaultV2Fragment
        }
      }
    }
  }
`);

export type { Market, MarketNonIdle };

export function isNonIdleMarket(market: Market | null): market is MarketNonIdle {
  return !!market && market.isIdle === false && !!market.collateralAsset;
}

const marketHistoryQuery = graphql(`
  query MarketHistory($chainId: Int!, $marketId: String!, $options: TimeseriesOptions!) {
    markets(first: 1, where: { chainId_in: [$chainId], uniqueKey_in: [$marketId] }) {
      items {
        historicalState {
          ...MarketHistoryFragment
        }
      }
    }
  }
`);

export const getMarket = cache(async (chainId: SupportedChainId, marketId: Hex): Promise<Market> => {
  const [data, history] = await Promise.all([
    executeMorphoQuery(query, {
      chainId,
      marketId,
      capsFirst: CAPS_PAGE_SIZE,
      adaptersFirst: SUPPLIER_ADAPTERS_PAGE_SIZE,
      positionsFirst: POSITIONS_PAGE_SIZE,
    }),
    // One request per chart resolution, see `historyOptions`.
    Promise.all(
      HISTORY_RANGE_KEYS.map(async (range) => {
        const response = await executeMorphoQuery(marketHistoryQuery, {
          chainId,
          marketId,
          options: historyOptions(range),
        });
        return response.markets.items?.[0]?.historicalState ?? null;
      }),
    ),
  ]);

  const market = data.markets.items?.[0];
  if (!market) {
    throw new Error(`Market not found: ${chainId}:${marketId}`);
  }

  const summary = toMarketSummary(market);
  const state = market.state;
  const loanDecimals = summary.loanAsset.decimals;
  const collateralDecimals = summary.collateralAsset?.decimals ?? 0;
  const loanPriceUsd = market.loanAsset.price?.usd ?? null;
  const collateralPriceUsd = market.collateralAsset?.price?.usd ?? null;

  const [hourly, daily, weekly] = history.map((series) =>
    series
      ? toMarketHistoricalEntries(
          {
            supplyAssets: series.supplyAssets,
            supplyAssetsUsd: series.supplyAssetsUsd,
            borrowAssets: series.borrowAssets,
            borrowAssetsUsd: series.borrowAssetsUsd,
            collateralAssets: series.collateralAssets,
            collateralAssetsUsd: series.collateralAssetsUsd,
            borrowApy1d: series.dailyBorrowApy,
            netBorrowApy1d: series.dailyNetBorrowApy,
            borrowApy7d: series.weeklyBorrowApy,
            netBorrowApy7d: series.weeklyNetBorrowApy,
            borrowApy30d: series.monthlyBorrowApy,
            netBorrowApy30d: series.monthlyNetBorrowApy,
          },
          loanDecimals,
          collateralDecimals,
        )
      : [],
  );

  return {
    ...summary,
    isIdle: summary.collateralAsset === null,
    totalSupplied: toAmount(state?.supplyAssets, loanDecimals, state?.supplyAssetsUsd),
    liquidityInMarket: toAmount(state?.liquidityAssets, loanDecimals, state?.liquidityAssetsUsd),
    publicAllocatorSharedLiquidity: sumPublicAllocatorSharedLiquidity(
      market.publicAllocatorSharedLiquidity,
      loanDecimals,
      loanPriceUsd,
    ),
    collateralAsset: summary.collateralAsset ? { ...summary.collateralAsset, priceUsd: collateralPriceUsd } : null,
    loanAsset: { ...summary.loanAsset, priceUsd: loanPriceUsd },
    vaultAllocations: toMarketVaultAllocations(
      market.marketId,
      state?.supplyAssets,
      loanDecimals,
      loanPriceUsd,
      market.supplyingVaults,
      market.supplyingVaultV2s,
    ),
    utilization: state?.utilization ?? 0,
    irm: {
      address: getAddress(market.irmAddress),
      targetUtilization: ADAPTIVE_CURVE_IRM_TARGET_UTILIZATION,
      curve: market.currentIrmCurve ?? [],
    },
    liquidationPenalty: computeLiquidationPenalty(market.lltv),
    oracleAddress: market.oracle?.address ? getAddress(market.oracle.address) : null,
    collateralPriceInLoanAsset: toCollateralPriceInLoanAsset(state?.price, loanDecimals, collateralDecimals),
    historical: { hourly: hourly ?? [], daily: daily ?? [], weekly: weekly ?? [] },
  };
});
