import pRetry, { type Options } from "p-retry";
import { trackEvent } from "@/common/utils/trackEvent";

// 8s default timeout (just sanity timeout)
const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

export async function promiseWithRetry<T>(
  p: (attemptCount: number) => PromiseLike<T>,
  options: Partial<Options> = {},
): Promise<T> {
  const defaultPRetryOptions: Options = {
    retries: 1, // Single retry covers rare network issues
    minTimeout: 200, // [ms]
    factor: 2, // Exponential backoff factor
    randomize: true, // Avoid thundering herd effect
    onFailedAttempt: (e) => {
      console.warn(`pRetry attempt failed, trying again: attempt: ${e.attemptNumber}, message: ${e.message}`, e);
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
      signal: options?.requestOptions?.signal ?? AbortSignal.timeout(DEFAULT_REQUEST_TIMEOUT_MS), // By default we have a timeout on every request
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
    trackEvent("data-fetch-error", {
      url: url.toString(),
      error: `${e}`,
    });
    throw new Error("Fetch failed");
  }
}
