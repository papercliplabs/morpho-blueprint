import pRetry, { type Options } from "p-retry";
import { trackEvent } from "@/data/trackEvent";

export async function promiseWithRetry<T>(
  p: (attemptCount: number) => PromiseLike<T>,
  options: Partial<Options> = {},
): Promise<T> {
  // Default: retry 5 times, 400ms -> 800ms -> 1600ms -> 3200ms -> 6400ms (total time is 15600ms)
  const defaultPRetryOptions: Options = {
    retries: 5,
    minTimeout: 400, // [ms]
    factor: 2, // Exponential backoff factor
    randomize: true, // Avoid thundering herd effect
    onFailedAttempt: (e) => {
      console.warn(`pRetry attempt failed, trying again: attempt: ${e.attemptNumber}, message: ${e.message}`);
    },
  };

  return pRetry(p, {
    ...defaultPRetryOptions,
    ...options,
  });
}

export type RetryOptions = Partial<Options> | "disabled";
export interface FetchJsonResponseOptions {
  requestOptions?: RequestInit;
  retryOptionOverrides?: RetryOptions;
}

export async function fetchJsonResponse<T>(url: string | URL, options?: FetchJsonResponseOptions): Promise<T> {
  async function fetchJsonResponse() {
    const response = await fetch(url, {
      ...(options?.requestOptions ?? {}),
      headers: {
        "Content-Type": "application/json",
        ...(options?.requestOptions?.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${url}`);
    }

    return response.json();
  }

  try {
    return options?.retryOptionOverrides === "disabled"
      ? await fetchJsonResponse() // Bypass retries
      : await promiseWithRetry(fetchJsonResponse, options?.retryOptionOverrides);
  } catch (e) {
    console.error(`Fetch failed for ${url} - ${e}`);
    trackEvent("fetch-json-response-failed", {
      url: url.toString(),
      error: `${e}`,
    });
    throw new Error("Fetch failed");
  }
}
