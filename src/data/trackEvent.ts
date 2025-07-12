"use server";

import { APP_CONFIG } from "@/config";

// Track event from server action so client can't block
export async function trackEvent(name: string, payload: Record<string, string | number>) {
  const timestamp = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    timestamp,
  };

  // Server logging for now in case the payload exceeds event max event size
  console.log("event-from-server: ", name, fullPayload);

  // Plausible
  if (process.env.NEXT_PUBLIC_PLAUSIBLE_DATA_DOMAIN && process.env.NEXT_PUBLIC_PLAUSIBLE_BASE_URL) {
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_PLAUSIBLE_BASE_URL}/api/event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: APP_CONFIG.metadata.url,
        },
        body: JSON.stringify({
          domain: process.env.NEXT_PUBLIC_PLAUSIBLE_DATA_DOMAIN,
          name,
          url: APP_CONFIG.metadata.url,
          props: fullPayload,
        }),
      });
      if (!resp.ok) {
        console.error("Plausible event tracking failed", resp.status, await resp.text(), { name, payload });
      }
    } catch (e) {
      console.error("Plausible event tracking failed", e, { name, payload });
    }
  }
}
