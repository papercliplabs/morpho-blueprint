import { graphql } from "@/generated/gql/whisk";

graphql(`
  fragment MorphoVaultV1Details on MorphoVault {
    metadata {
      description
      curator {
        image
        name
        url
      }
    }

    totalLiquidity {
      usd
    }

    performanceFeeRaw: performanceFee
    feeRecipientAddress
    ownerAddress
    curatorAddress
    guardianAddress

    ...MorphoVaultV1MarketAllocation
      
    historical {
      hourly {
        ...VaultHistoricalEntryFragment
      }
      daily {
        ...VaultHistoricalEntryFragment
      }
      weekly {
        ...VaultHistoricalEntryFragment
      }
    }
  }

  fragment MorphoVaultV1Collateral on MorphoVault {
    ... on MorphoVault {        
      marketAllocations {
        enabled
        vaultSupplyShare
        position {
          supplyAmount {
            usd
          }
        }
        market {
          collateralAsset {
            icon
            name
            symbol
          }
        }
      }
    }
  }

  fragment MorphoVaultV1MarketAllocation on MorphoVault {
    marketAllocations {
      enabled
      market {
        marketId
        chain {
          ...ChainInfoFragment
        }
        isIdle
        name
        lltv {
          raw
          formatted
        }
        collateralAsset {
          ...TokenInfoFragment
        }
        loanAsset {
          ...TokenInfoFragment
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
      }
      position {
        supplyAmount {
          raw
          formatted
          usd
        }
        supplyShares
      }
      supplyCap {
        raw
        formatted
        usd
      }
      vaultSupplyShare
    }
  }
`);
