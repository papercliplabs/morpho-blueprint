"use server";

import { APP_CONFIG } from "@/config";

export type EventName =
  | "app-error" // A client side app error occured and was caught by the error boundry
  | "csp-violation" // A content security policy (CSP) violation has occurred
  | "data-fetch-error" // An error occured while trying to fetch data
  | "tx-pending" // A transaction has been successfully sent and is pending block inclusion
  | "tx-success" // A transaction was included in a block and was successfully executed
  | "tx-revert" // A transaction was included in a block but reverted
  | "tx-flow-error"; // An error occured within the transaction flow (might be during simulation, sending, or waiting for tx receipt)

// Track event from server action to prevent client-side blocking
// This should be called with a fire and forget approach
export async function trackEvent(name: EventName, payload: Record<string, string | number>) {
  // Server logging in case eventÇb is not provided or fails
  console.log("event-from-server: ", name, payload);

  if (APP_CONFIG.analytics.eventCb) {
    try {
      await APP_CONFIG.analytics.eventCb(name, payload);
    } catch (e) {
      console.warn("Failed to track event via eventCb", e);
    }
  }
}
