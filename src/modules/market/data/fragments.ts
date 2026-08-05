import { graphql } from "@/generated/gql/morpho";

graphql(`
  # Market metadata + supply-side APYs, as embedded in vault allocation rows.
  fragment MarketInfoFragment on Market {
    marketId
    lltv
    chain {
      ...ChainInfoFragment
    }
    collateralAsset {
      ...AssetInfoFragment
    }
    loanAsset {
      ...AssetInfoFragment
    }
    state {
      supplyAssets
      supplyAssetsUsd
      avgSupplyApy
      avgNetSupplyApy
      dailySupplyApy
      dailyNetSupplyApy
      weeklySupplyApy
      weeklyNetSupplyApy
      monthlySupplyApy
      monthlyNetSupplyApy
      rewards {
        ...MarketRewardFragment
      }
    }
  }

  # Market row in the borrow table.
  fragment MarketSummaryFragment on Market {
    marketId
    lltv
    chain {
      ...ChainInfoFragment
    }
    collateralAsset {
      ...AssetInfoFragment
    }
    loanAsset {
      ...AssetInfoFragment
    }
    state {
      borrowAssets
      borrowAssetsUsd
      borrowApy
      netBorrowApy
      avgBorrowApy
      avgNetBorrowApy
      dailyBorrowApy
      dailyNetBorrowApy
      weeklyBorrowApy
      weeklyNetBorrowApy
      monthlyBorrowApy
      monthlyNetBorrowApy
      rewards {
        ...MarketRewardFragment
      }
    }
  }
`);

// Inverse of the vault -> market allocation join: which vaults supply this market, and how much.
// Vault V1 exposes it as `state.allocation`, vault V2 as MarketV1 caps.
graphql(`
  fragment MarketSupplyingVaultV1Fragment on Vault {
    address
    name
    asset {
      ...AssetInfoFragment
    }
    chain {
      ...ChainInfoFragment
    }
    state {
      curator
      curators {
        ...CuratorInfoFragment
      }
      allocation {
        supplyAssets
        supplyAssetsUsd
        supplyCap
        supplyCapUsd
        supplyShares
        market {
          marketId
        }
      }
    }
  }

  fragment MarketSupplyingVaultV2Fragment on VaultV2 {
    address
    name
    # MarketV1 cap allocations are only refreshed on (de)allocation; the supplier row joins the
    # adapter's live position on this market instead, keeping the cap for limits and as fallback.
    adapters(first: $adaptersFirst) {
      pageInfo {
        count
        countTotal
      }
      items {
        __typename
        address
        ... on MorphoMarketV1Adapter {
          positions(first: $positionsFirst) {
            pageInfo {
              count
              countTotal
            }
            items {
              market {
                marketId
              }
              state {
                supplyAssets
                supplyAssetsUsd
              }
            }
          }
        }
      }
    }
    curator {
      address
    }
    asset {
      ...AssetInfoFragment
    }
    chain {
      ...ChainInfoFragment
    }
    curators(first: 1) {
      items {
        ...CuratorInfoFragment
      }
    }
    caps(first: $capsFirst) {
      pageInfo {
        count
        countTotal
      }
      items {
        type
        allocation
        absoluteCap
        data {
          __typename
          ... on MarketV1CapData {
            adapterAddress
            market {
              marketId
            }
          }
        }
      }
    }
  }
`);

graphql(`
  # Market chart series for one chart resolution.
  fragment MarketHistoryFragment on MarketHistory {
    supplyAssets(options: $options) {
      x
      y
    }
    supplyAssetsUsd(options: $options) {
      x
      y
    }
    borrowAssets(options: $options) {
      x
      y
    }
    borrowAssetsUsd(options: $options) {
      x
      y
    }
    collateralAssets(options: $options) {
      x
      y
    }
    collateralAssetsUsd(options: $options) {
      x
      y
    }
    dailyBorrowApy(options: $options) {
      x
      y
    }
    dailyNetBorrowApy(options: $options) {
      x
      y
    }
    weeklyBorrowApy(options: $options) {
      x
      y
    }
    weeklyNetBorrowApy(options: $options) {
      x
      y
    }
    monthlyBorrowApy(options: $options) {
      x
      y
    }
    monthlyNetBorrowApy(options: $options) {
      x
      y
    }
  }
`);
