import type { EventName } from "@/data/trackEvent";

export async function eventCb(name: EventName, payload: Record<string, string | number>) {
  // Called from the server whenever an app event occurs.
  // You can send this to the analytics collection pipeline of your choice.
  console.log("New event received: ", name, payload);
}
