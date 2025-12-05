import { graphql } from "@/generated/gql/whisk";

graphql(`
  fragment MorphoVaultV2Details on MorphoVaultV2 {
    __typename
    
    adapters {
      name
      isEnabled
      adapterAddress
      adapterCap {        
        allocation {
          formatted
          usd
        }        
      }

      ... on VaultV1Adapter {
        __typename
        vault {
          vaultAddress
          name
          
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
          
          chain {
            ...ChainInfoFragment
          }
          asset {
            ...TokenInfoFragment
          }
          apy(timeframe: $timeframe) {
            ...ApyFragment
          }
        }        
      }
      
      ... on MarketV1Adapter {
        __typename
      }

      ... on BoxVaultAdapter {
        __typename
      }

      ... on UnknownAdapter {
        __typename
      }    
    }

    curatorAddress
    
    metadata {
      curator {
        ...CuratorInfoFragment
      }
      description
    }

    sentinelAddresses

    performanceFee {
      formatted
    }

    managementFee {
      formatted
    }

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

  fragment MorphoVaultV2Collateral on MorphoVaultV2 {
    ... on MorphoVaultV2 {        
      adapters {
        ... on MarketV1Adapter {
          collateralCaps {
            allocation {
              usd
            }
            relativeCap {
              formatted
            }
            collateralToken {
              icon
              name
              symbol
            }
          }
        }
        ... on VaultV1Adapter {
          vault {
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
      }  
    }
  }  
`);
