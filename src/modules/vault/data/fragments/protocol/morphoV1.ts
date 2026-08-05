import { graphql } from "@/generated/gql/morpho";

graphql(`
  fragment MorphoVaultV1SummaryFragment on Vault {
    address
    name
    asset {
      ...AssetInfoWithPriceFragment
    }
    chain {
      ...ChainInfoFragment
    }
    metadata {
      description
    }
    state {
      totalAssets
      totalAssetsUsd
      fee
      avgNetApy(lookback: $lookbackV1)
      avgNetApyExcludingRewards(lookback: $lookbackV1)
      allRewards {
        ...VaultRewardFragment
      }
      curators {
        ...CuratorInfoFragment
      }
    }
  }

  fragment MorphoVaultV1CollateralFragment on Vault {
    state {
      totalAssets
      allocation {
        ...VaultCollateralAllocationFragment
      }
    }
  }

  # Realized net APY over each range the chart offers, computed by the API from share-price
  # evolution. Detail-only: the earn list never renders a chart.
  fragment MorphoVaultV1DetailsFragment on Vault {
    liquidity {
      underlying
      usd
    }
    state {
      avgNetApy7d: avgNetApy(lookback: SEVEN_DAYS)
      avgNetApy30d: avgNetApy(lookback: THIRTY_DAYS)
      avgNetApy90d: avgNetApy(lookback: NINETY_DAYS)
      avgNetApyInception: avgNetApy(lookback: INCEPTION)
      feeRecipient
      owner
      curator
      guardian
      allocation {
        ...VaultAllocationFragment
      }
    }
  }

  # The same vault V1 shape, as held through a vault V2 MetaMorpho adapter.
  fragment UnderlyingMorphoVaultV1Fragment on Vault {
    address
    name
    chain {
      ...ChainInfoFragment
    }
    asset {
      ...AssetInfoFragment
    }
    state {
      totalAssets
      totalAssetsUsd
      avgNetApy(lookback: $lookbackV1)
      avgNetApyExcludingRewards(lookback: $lookbackV1)
      allRewards {
        ...VaultRewardFragment
      }
      allocation {
        ...VaultAllocationFragment
      }
    }
  }
`);

graphql(`
  # Vault V1 chart series for one chart resolution. The interval and time range are passed in as
  # \`options\`, so the same document serves hourly / daily / weekly.
  fragment MorphoVaultV1HistoryFragment on VaultHistory {
    totalAssets(options: $options) {
      x
      y
    }
    totalAssetsUsd(options: $options) {
      x
      y
    }
    netApy(options: $options) {
      x
      y
    }
    dailyNetApy(options: $options) {
      x
      y
    }
    weeklyNetApy(options: $options) {
      x
      y
    }
    monthlyNetApy(options: $options) {
      x
      y
    }
  }
`);
