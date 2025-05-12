import "server-only";
import { cache } from "react";

import { graphql } from "@/generated/gql/whisk";
import { GetVaultQuery } from "@/generated/gql/whisk/graphql";

import { whiskClient } from "./client";

const query = graphql(`
  query getVault($chainId: Number!, $address: String!) {
    morphoVault(chainId: $chainId, address: $address) {
      vaultAddress
      name
    }
  }
`);

export const getExample = cache(async () => {
  const vault = await whiskClient.request<GetVaultQuery>(query, {
    chainId: 1,
    address: "0xd63070114470f685b75B74D60EEc7c1113d33a3D",
  });
  return vault.morphoVault ?? null;
});
