import "server-only";
import { cache } from "react";
import { Address } from "viem";

import { graphql } from "@/generated/gql/whisk";

import { executeWhiskQuery } from "./execute";

const query = graphql(`
  query getAccountIsOfacSanctioned($address: String!) {
    identity(address: $address) {
      isOfacSanctioned
    }
  }
`);

export const getAccountIsOfacSanctioned = cache(async (address: Address) => {
  const isOfacSanctioned = await executeWhiskQuery(query, { address });
  return isOfacSanctioned.identity?.isOfacSanctioned;
});
