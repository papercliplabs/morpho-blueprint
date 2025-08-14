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
    category
  }

  fragment ChainInfoFragment on Chain {
    id
    name
    icon
  }

  fragment CuratorInfoFragment on Curator {
    name
    image
    url
  }

  fragment ApyFragment on Apy {
    base
    rewards {
      asset {
        ...TokenInfoFragment
      }
      apr
    }
    total
    fee
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

    metadata {
      curators {
        ...CuratorInfoFragment
      }
    }

    totalSupplied {
      raw
      formatted
      usd
    }

    totalLiquidity {
      raw
      formatted
      usd
    }

    supplyApy {
      ...ApyFragment
    }

    supplyApy1d {
      ...ApyFragment
    }

    supplyApy7d {
      ...ApyFragment
    }

    supplyApy30d {  
      ...ApyFragment
    }

    marketAllocations {
      market {
        collateralAsset {
          ...TokenInfoFragment
        }
      }
    }
  }

  fragment VaultHistoricalEntryFragment on MorphoVaultHistoricalEntry {
    bucketTimestamp
    totalSupplied {
      formatted
      usd
    }
    supplyApy1d{
      base
      total
    }
    supplyApy7d{
      base
      total
    }
    supplyApy30d{
      base
      total
    }
  }

  fragment MarketSummaryFragment on MorphoMarket {
    chain {
      ...ChainInfoFragment
    }

    name

    marketId

    totalBorrowed {
      raw
      formatted
      usd
    }

    collateralAsset {
      ...TokenInfoFragment
    }

    loanAsset {
      ...TokenInfoFragment
    }

    lltv {
      raw 
      formatted
    }

    borrowApy {
      ...ApyFragment
    }

    borrowApy1d {
      ...ApyFragment
    }

    borrowApy7d {
      ...ApyFragment
    }

    borrowApy30d {
      ...ApyFragment
    }
    

    vaultAllocations {
      vault {
        vaultAddress
      }
      position {
        supplyAmount {
          usd
        }
      }
      supplyCap {
        usd
      }
    }
  }

  fragment MarketHistoricalEntryFragment on MorphoMarketHistoricalEntry {
    bucketTimestamp
    totalSupplied {
      formatted
      usd
    }
    totalBorrowed {
      formatted
      usd
    }
    totalCollateral {
      formatted
      usd
    }
    borrowApy1d{
      base
      total
    }
    borrowApy7d{
      base
      total
    }
    borrowApy30d{
      base
      total
    }
  }
`);

// Some cleaner type names
export type TokenInfo = TokenInfoFragmentFragment;
export type ChainInfo = ChainInfoFragmentFragment;
export type CuratorInfo = CuratorInfoFragmentFragment;
