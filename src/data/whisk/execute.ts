"server-only";
import type { TypedDocumentString } from "@/generated/gql/whisk/graphql";
import { fetchJsonResponse } from "@/utils/promise";

export async function executeWhiskQuery<TResult, TVariables>(
  query: TypedDocumentString<TResult, TVariables>,
  ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
) {
  const response = await fetchJsonResponse<{ data: TResult }>(
    process.env.WHISK_API_URL!,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/graphql-response+json",
        Authorization: `Bearer ${process.env.WHISK_API_KEY!}`,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    },
    // Uses retry params
  );

  return response.data;
}
