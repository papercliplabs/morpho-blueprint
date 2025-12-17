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
`);

// Some cleaner type names
export type TokenInfo = TokenInfoFragmentFragment;
export type ChainInfo = ChainInfoFragmentFragment;
export type CuratorInfo = CuratorInfoFragmentFragment;
