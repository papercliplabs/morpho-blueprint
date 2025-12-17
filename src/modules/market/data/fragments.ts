import { graphql } from "@/generated/gql/whisk";

graphql(`
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
