import { graphql } from "@/generated/gql/whisk";
import type {
  ChainInfoFragmentFragment,
  CuratorInfoFragmentFragment,
  TokenInfoFragmentFragment,
} from "@/generated/gql/whisk/graphql";

graphql(`
  fragment TokenInfoFragment on Token {
    address
    symbol
    decimals
    icon
  }

  fragment ChainInfoFragment on Chain {
    id
    name
    icon
  }

  fragment CuratorInfoFragment on Curators {
    name
    image
    url
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
      ...ChainInfoFragment
    }
    vaultAddress

    name

    asset {
      ...TokenInfoFragment
    }

    curatorAddress
    metadata {
      curators {
        ...CuratorInfoFragment
      }
    }

    supplyAssets
    supplyAssetsUsd

    liquidityAssetsUsd

    marketAllocations {
      market {
        marketId
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
      ...ChainInfoFragment
    }

    name

    marketId

    borrowAssetsUsd

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
export type ChainInfo = ChainInfoFragmentFragment;
export type CuratorInfo = CuratorInfoFragmentFragment;
