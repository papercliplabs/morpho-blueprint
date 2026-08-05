import "server-only";

import { MathLib } from "@morpho-org/blue-sdk";
import { type Address, getAddress, type Hex } from "viem";
import { toAmount, toAmountWithPrice, toBigInt, toRatio } from "@/common/data/adapters/amount";
import { pageSize } from "@/common/data/adapters/pagination";
import { getWalletTokenBalances } from "@/common/data/rpc/getWalletTokenBalances";
import { executeMorphoQuery } from "@/common/utils/executeMorphoQuery";
import type { SupportedChainId } from "@/config/types";
import { graphql } from "@/generated/gql/morpho";
import type { MarketPosition } from "@/modules/market/market.types";
import { getSupportedMarketIds } from "./getSupportedMarketIds";

// The market list rides along so that a market the account has no position in still resolves its
// assets, and therefore its wallet balances: the table's "in wallet" columns depend on it.
const query = graphql(`
  query MarketPositions($first: Int!, $chainIds: [Int!]!, $marketIds: [String!]!, $accountAddress: String!) {
    marketPositions(
      first: $first
      where: { chainId_in: $chainIds, marketUniqueKey_in: $marketIds, userAddress_in: [$accountAddress] }
    ) {
      items {
        market {
          marketId
          chain {
            id
          }
        }
        state {
          borrowAssets
          borrowAssetsUsd
          collateral
          collateralUsd
          collateralValue
        }
      }
    }
    markets(first: $first, where: { chainId_in: $chainIds, uniqueKey_in: $marketIds }) {
      items {
        marketId
        chain {
          id
        }
        collateralAsset {
          address
          decimals
          price {
            usd
          }
        }
        loanAsset {
          address
          decimals
          price {
            usd
          }
        }
      }
    }
  }
`);

export type { MarketPosition };

/** ChainId -> MarketId -> MarketPosition */
export type MarketPositionMap = Record<SupportedChainId, Record<Hex, MarketPosition>>;

function positionKey(chainId: number, marketId: string) {
  return `${chainId}:${marketId}`;
}

export const getMarketPositions = async (accountAddress: Address): Promise<MarketPositionMap> => {
  const supportedMarketIds = await getSupportedMarketIds();

  // One request per chain, for the same reason as `getMarketSummaries`: `chainId_in` and
  // `uniqueKey_in` are independent filters, so a combined request matches their Cartesian product
  // and an unconfigured cross-chain match can push a configured market — and its position and
  // wallet-balance rows — off a page sized to the intended pair count.
  const byChain = Object.entries(supportedMarketIds)
    .map(([chainId, ids]) => [Number.parseInt(chainId) as SupportedChainId, Array.from(ids)] as const)
    .filter(([, ids]) => ids.length > 0);

  const data = {} as MarketPositionMap;
  if (byChain.length === 0) return data;

  const responses = await Promise.all(
    byChain.map(([chainId, ids]) =>
      // Paginated-field cost scales with `first`, so request exactly the derived market set.
      executeMorphoQuery(query, {
        first: pageSize(ids.length, "markets"),
        chainIds: [chainId],
        marketIds: ids,
        accountAddress,
      }),
    ),
  );

  const chainIds = byChain.map(([chainId]) => chainId);

  const stateByMarket = new Map<
    string,
    NonNullable<(typeof responses)[number]["marketPositions"]["items"]>[number]["state"]
  >();
  for (const response of responses) {
    for (const position of response.marketPositions.items ?? []) {
      stateByMarket.set(positionKey(position.market.chain.id, position.market.marketId), position.state);
    }
  }

  const markets = responses.flatMap((response) =>
    (response.markets.items ?? []).filter((market) =>
      // Filter out the potential for a market with the same id on another chain.
      supportedMarketIds[market.chain.id as SupportedChainId]?.includes(market.marketId),
    ),
  );

  // One multicall per chain over every distinct loan/collateral token.
  const balancesByChain = new Map(
    await Promise.all(
      chainIds.map(
        async (chainId) =>
          [
            chainId,
            await getWalletTokenBalances(
              chainId,
              accountAddress,
              markets
                .filter((market) => market.chain.id === chainId)
                .flatMap((market) =>
                  [market.loanAsset.address, market.collateralAsset?.address].filter((address) => address != null),
                )
                .map((address) => getAddress(address)),
            ),
          ] as const,
      ),
    ),
  );

  for (const market of markets) {
    const chainId = market.chain.id as SupportedChainId;
    const state = stateByMarket.get(positionKey(chainId, market.marketId));
    const balances = balancesByChain.get(chainId);

    const loanDecimals = Math.round(market.loanAsset.decimals);
    const loanPriceUsd = market.loanAsset.price?.usd ?? null;
    const collateralDecimals = Math.round(market.collateralAsset?.decimals ?? 0);
    const collateralPriceUsd = market.collateralAsset?.price?.usd ?? null;

    const loanBalance = balances?.get(market.loanAsset.address.toLowerCase());
    const collateralBalance = market.collateralAsset
      ? balances?.get(market.collateralAsset.address.toLowerCase())
      : undefined;

    // Whisk served `ltv` directly. Derive it from the position's borrow value over the oracle value
    // of its collateral, rounding up, matching the action layer's position-change math.
    const collateralValue = toBigInt(state?.collateralValue);
    const borrowAssets = toBigInt(state?.borrowAssets);

    (data[chainId] ??= {})[market.marketId] = {
      market: { chain: { id: chainId }, marketId: market.marketId },
      collateralAmount: state
        ? toAmount(state.collateral, collateralDecimals, state.collateralUsd)
        : toAmountWithPrice(0, collateralDecimals, collateralPriceUsd),
      borrowAmount: state
        ? toAmount(state.borrowAssets, loanDecimals, state.borrowAssetsUsd)
        : toAmountWithPrice(0, loanDecimals, loanPriceUsd),
      ltv: toRatio(collateralValue > 0n ? MathLib.wDivUp(borrowAssets, collateralValue) : 0n),
      walletLoanAssetHolding:
        loanBalance === undefined ? null : { balance: toAmountWithPrice(loanBalance, loanDecimals, loanPriceUsd) },
      walletCollateralAssetHolding:
        collateralBalance === undefined
          ? null
          : { balance: toAmountWithPrice(collateralBalance, collateralDecimals, collateralPriceUsd) },
    };
  }

  return data;
};
