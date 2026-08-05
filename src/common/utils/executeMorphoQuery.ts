import "server-only";

import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { type GraphQLError, print } from "graphql";
import { fetchJsonResponse } from "@/common/utils/fetch";

// Public, keyless endpoint. Deployments pointing at a partner instance override this via env.
const DEFAULT_MORPHO_API_URL = "https://api.morpho.org/graphql";

interface MorphoQueryExtensions {
  complexity?: number;
  maximumComplexity?: number;
  warnings?: { type: string; field?: string; path?: string; message?: string }[];
}

/**
 * Server-only chokepoint for every read against the Morpho GraphQL API.
 *
 * Contract (unchanged from the Whisk executor it replaces):
 * - partial GraphQL errors are logged and the available `data` is still returned, so a degraded
 *   response still renders;
 * - a whole-query failure (`data: null`) throws.
 */
export async function executeMorphoQuery<TResult, TVariables>(
  query: TypedDocumentNode<TResult, TVariables>,
  ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
) {
  const apiKey = process.env.MORPHO_API_KEY;

  const response = await fetchJsonResponse<{
    data: TResult | null;
    errors?: GraphQLError[];
    extensions?: MorphoQueryExtensions;
  }>(process.env.MORPHO_API_URL || DEFAULT_MORPHO_API_URL, {
    requestOptions: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // The partner API instance authenticates with x-api-key. The public endpoint is keyless,
        // so the header is only sent when a key is configured (keeps the template runnable as-is).
        ...(apiKey ? { "x-api-key": apiKey } : {}),
      },
      body: JSON.stringify({
        query: print(query),
        variables,
      }),
    },
  });

  // Log errors, but use the rest of the available data
  if ((response.errors?.length ?? 0) > 0) {
    console.warn("Morpho query errors", response.errors);
  }

  // The API team's operational rule is that production queries must not use deprecating fields.
  // Surfacing the response warnings here is what makes a regression visible.
  if ((response.extensions?.warnings?.length ?? 0) > 0) {
    console.warn("Morpho query warnings", response.extensions?.warnings);
  }

  // Throw on an entire query failure
  if (response.data == null) {
    throw new Error("Morpho entire query failure");
  }

  return response.data;
}
