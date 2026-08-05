import { graphql } from "@/generated/gql/morpho";

// Shared building blocks for every Morpho document in the app.
// The generated types describe the raw API response; the adapters in ./adapters map them onto the
// app-owned shapes in ./types, which is what the rest of the app consumes.
graphql(`
  fragment AssetInfoFragment on Asset {
    address
    symbol
    name
    decimals
    logoURI
    tags
  }

  fragment AssetInfoWithPriceFragment on Asset {
    ...AssetInfoFragment
    price {
      usd
    }
  }

  fragment ChainInfoFragment on Chain {
    id
    network
  }

  fragment CuratorInfoFragment on Curator {
    name
    image
    socials {
      type
      url
    }
    state {
      aum
    }
  }

  fragment VaultRewardFragment on VaultStateReward {
    asset {
      ...AssetInfoFragment
    }
    supplyApr
  }

  fragment MarketRewardFragment on MarketStateReward {
    asset {
      ...AssetInfoFragment
    }
    supplyApr
    borrowApr
  }
`);
