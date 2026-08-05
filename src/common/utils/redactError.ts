/**
 * Reduces an error to a log-safe message with URLs stripped: viem embeds the RPC URL in its
 * errors, and a credential-bearing provider URL must not be copied into server logs.
 */
export function redactError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/https?:\/\/\S+/g, "<rpc-url>");
}
