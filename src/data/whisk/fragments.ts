import { graphql } from "@/generated/gql/whisk";
import { TokenInfoFragmentFragment } from "@/generated/gql/whisk/graphql";

graphql(`
  fragment TokenInfoFragment on Token {
    address
    symbol
    decimals
    icon
  }

  fragment VaultApyFragment on ApyAndSupplyApy {
    base
    rewards {
      asset {
        ...TokenInfoFragment
      }
      apr
    }
    total
    performanceFee
  }

  fragment MarketApyFragment on Apy {
    base
    rewards {
      asset {
        ...TokenInfoFragment
      }
      apr
    }
    total
  }

  fragment VaultSummaryFragment on MorphoVault {
    chain {
      id
      name
      icon
    }
    vaultAddress

    name

    asset {
      ...TokenInfoFragment
    }

    curatorAddress
    # TODO: missing curator in Whisk

    supplyAssets
    supplyAssetsUsd

    liquidityAssetsUsd

    marketAllocations {
      market {
        collateralAsset {
          ...TokenInfoFragment
        }
      }
    }

    supplyApy {
      ...VaultApyFragment
    }
  }

  fragment MarketSummaryFragment on MorphoMarket {
    chain {
      id
      name
      icon
    }

    name

    marketId

    collateralAsset {
      ...TokenInfoFragment
    }

    loanAsset {
      ...TokenInfoFragment
    }

    lltv
    borrowApy {
      ...MarketApyFragment
    }
  }
`);

// Some cleaner type names
export type TokenInfo = TokenInfoFragmentFragment;
