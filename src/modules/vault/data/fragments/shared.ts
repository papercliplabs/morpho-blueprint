import { graphql } from "@/generated/gql/morpho";

graphql(`
  # A vault V1's allocation to a single Morpho Blue market.
  fragment VaultAllocationFragment on VaultAllocation {
    supplyAssets
    supplyAssetsUsd
    supplyCap
    supplyCapUsd
    supplyShares
    market {
      ...MarketInfoFragment
    }
  }

  # Trimmed allocation shape backing the earn-table exposure tooltip.
  fragment VaultCollateralAllocationFragment on VaultAllocation {
    supplyAssets
    supplyAssetsUsd
    supplyCap
    market {
      collateralAsset {
        logoURI
        name
        symbol
      }
    }
  }
`);
