import { graphql } from "@/generated/gql/whisk";

graphql(`
  fragment VaultCollateralFragment on Erc4626Vault {
    ... MorphoVaultV1Collateral
    ... MorphoVaultV2Collateral
  }

  fragment VaultSummaryFragment on Erc4626Vault {
    __typename
    chain {
      ...ChainInfoFragment
    }
    vaultAddress

    name

    asset {
      ...TokenInfoFragment
      priceUsd
    }

    totalAssets {
      raw
      formatted
      usd
    }

    apy(timeframe: $timeframe) {
      ...ApyFragment
    }

    ... VaultCollateralFragment
    
    ... on MorphoVault {              
      metadata {
        curator {
          ...CuratorInfoFragment
        }
      }
    }

    ... on MorphoVaultV2 {        
        metadata {
          curator {
            ...CuratorInfoFragment
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
`);
