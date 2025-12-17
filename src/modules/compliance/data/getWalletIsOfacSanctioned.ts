import "server-only";

import { cache } from "react";
import type { Address } from "viem";

import { graphql } from "@/generated/gql/whisk";
import { executeWhiskQuery } from "../../../common/utils/executeWhiskQuery";

const query = graphql(`
  query getWalletIsOfacSanctioned($address: Address!) {
    identity(address: $address) {
      isOfacSanctioned
    }
  }
`);

export const getWalletIsOfacSanctioned = cache(async (address: Address) => {
  const isOfacSanctioned = await executeWhiskQuery(query, { address });
  return isOfacSanctioned.identity?.isOfacSanctioned;
});
