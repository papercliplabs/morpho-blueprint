"server-only";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { type GraphQLError, print } from "graphql";
import { fetchJsonResponse } from "@/utils/fetch";

export async function executeWhiskQuery<TResult, TVariables>(
  query: TypedDocumentNode<TResult, TVariables>,
  ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
) {
  const response = await fetchJsonResponse<{ data: TResult; errors?: GraphQLError[] }>(process.env.WHISK_API_URL!, {
    requestOptions: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/graphql-response+json",
        Authorization: `Bearer ${process.env.WHISK_API_KEY!}`,
      },
      body: JSON.stringify({
        query: print(query),
        variables,
      }),
    },
  });

  // Log errors, but use the rest of the available data
  if ((response.errors?.length ?? 0) > 0) {
    console.warn("Whisk query errors", response.errors);
  }

  return response.data;
}
