import { graphql } from "@/generated/gql/morpho";

graphql(`
  fragment MorphoVaultV2SummaryFragment on VaultV2 {
    address
    name
    totalAssets
    totalAssetsUsd
    performanceFee
    managementFee
    avgNetApy(lookback: $lookbackV2)
    avgNetApyExcludingRewards(lookback: $lookbackV2)
    asset {
      ...AssetInfoWithPriceFragment
    }
    chain {
      ...ChainInfoFragment
    }
    metadata {
      description
    }
    curators(first: 1) {
      items {
        ...CuratorInfoFragment
      }
    }
    rewards {
      ...VaultRewardFragment
    }
  }

  # Exposure tooltip: only MetaMorpho adapters expand into collateral, matching the previous
  # behaviour. A vault V2 allocating directly through market adapters has no exposure breakdown.
  fragment MorphoVaultV2CollateralFragment on VaultV2 {
    # The top-level totalAssets is not virtually accrued; the summary total is rebuilt from the
    # (accrued) adapter assets plus these idle assets when the adapter page is full.
    idleAssets
    adapters(first: $adaptersFirst) {
      pageInfo {
        count
        countTotal
      }
      items {
        __typename
        address
        assets
        ... on MetaMorphoAdapter {
          metaMorpho {
            asset {
              decimals
            }
            ...MorphoVaultV1CollateralFragment
          }
        }
      }
    }
  }

  # Realized net APY over each range the chart offers, computed by the API from share-price
  # evolution. Detail-only: the earn list never renders a chart.
  fragment MorphoVaultV2DetailsFragment on VaultV2 {
    # The top-level totalAssets is not virtually accrued; the adapter layer rebuilds the current
    # total from the (accrued) adapter assets plus these idle assets when the adapter page is full.
    idleAssets
    idleAssetsUsd
    avgNetApy7d: avgNetApy(lookback: SEVEN_DAYS)
    avgNetApy30d: avgNetApy(lookback: THIRTY_DAYS)
    avgNetApy90d: avgNetApy(lookback: NINETY_DAYS)
    avgNetApyInception: avgNetApy(lookback: INCEPTION)
    curator {
      address
    }
    sentinels {
      sentinel {
        address
      }
    }
    adapters(first: $adaptersFirst) {
      pageInfo {
        count
        countTotal
      }
      items {
        __typename
        address
        assets
        assetsUsd
        ... on MetaMorphoAdapter {
          metaMorpho {
            ...UnderlyingMorphoVaultV1Fragment
          }
        }
        # Per-market current assets: MarketV1 cap allocations are only refreshed on (de)allocation,
        # so the breakdown joins each cap to the adapter's live position on that market instead.
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
    # Caps and adapters are separate paginated lists; the adapter layer joins them on
    # data.adapterAddress. Neither takes a type argument, so the type filter is client-side.
    caps(first: $capsFirst) {
      pageInfo {
        count
        countTotal
      }
      items {
        type
        absoluteCap
        relativeCap
        allocation
        data {
          __typename
          ... on AdapterCapData {
            adapterAddress
          }
          ... on MarketV1CapData {
            adapterAddress
            market {
              ...MarketInfoFragment
            }
          }
        }
      }
    }
  }
`);

graphql(`
  # Vault V2 chart series for one chart resolution. Only the configured APY window is fetched; see
  # \`vaultV2HistoryLookbackHours\` for the 24h smoothing cap the API imposes here.
  fragment MorphoVaultV2HistoryFragment on VaultV2History {
    totalAssets(options: $options) {
      x
      y
    }
    totalAssetsUsd(options: $options) {
      x
      y
    }
    avgNetApy(lookbackHours: $lookbackHours, options: $options) {
      x
      y
    }
  }
`);
