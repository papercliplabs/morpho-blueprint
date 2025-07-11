import pRetry, { type Options } from "p-retry";

import { trackEvent } from "@/data/trackEvent";

export const defaultPromiseRetryOptions: Options = {
  retries: 5,
  minTimeout: 400,
  factor: 2, // Exponential backoff factor
  randomize: true, // Avoid thundering herd effect
  onFailedAttempt: (e) => {
    console.warn(`pRetry attempt failed, trying again: attempt: ${e.attemptNumber}, message: ${e.message}`);
  },
};

export async function fetchJsonResponse<T>(
  url: string | URL,
  options: RequestInit = {
    headers: {
      "Content-Type": "application/json",
    },
  },
  retry: {
    enabled: boolean;
    options?: Options;
  } = {
    enabled: true,
    options: defaultPromiseRetryOptions,
  },
): Promise<T> {
  async function fetchInternal() {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Network response was not ok - ${url}`);
    }
    return response.json();
  }

  try {
    if (retry.enabled) {
      return await pRetry(fetchInternal, retry.options);
    }
    return await fetchInternal();
  } catch (e) {
    trackEvent("fetch-json-response-failed", {
      url: url.toString(),
      error: `${e}`,
    });
    throw e;
  }
}
