import { APP_CONFIG, SUPPORTED_CHAIN_IDS } from "@/config";
import type { SupportedChainId } from "@/config/types";
import { fetchJsonResponse } from "@/utils/fetch";
import { tryCatch } from "@/utils/tryCatch";

const MAX_PAYLOAD_BYTES = 1024 * 500; // 500KB

// Allowlist of permitted RPC methods to prevent abuse
const ALLOWED_RPC_METHODS = [
  "eth_call",
  "eth_getBalance",
  "eth_getBlockByNumber",
  "eth_blockNumber",
  "eth_chainId",
  "eth_estimateGas",
  "eth_getTransactionReceipt",
  "eth_getTransactionByHash",
  "eth_getCode",
  "eth_gasPrice",
  "eth_maxPriorityFeePerGas",
] as const;

type AllowedRpcMethodName = (typeof ALLOWED_RPC_METHODS)[number];

export async function POST(request: Request, { params }: { params: Promise<{ chainId: string }> }) {
  const maybeChainId = (await params).chainId;

  if (!maybeChainId || !SUPPORTED_CHAIN_IDS.includes(Number(maybeChainId) as SupportedChainId)) {
    return Response.json({ error: "Invalid chain ID" }, { status: 400 });
  }

  const chainId = Number(maybeChainId) as SupportedChainId;
  const rpcUrls = APP_CONFIG.chainConfig[chainId].rpcUrls;

  // Check Origin header is present as a simple prevention against server side abuse, but note can still be spoofed.
  // For client side, CORS will already prevent the requests.
  const origin = request.headers.get("Origin") ?? request.headers.get("Referer");
  if (!origin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Simple check against content lenght for browsers which support it
  // This is very cheap so worth doing early to avoid needing to parse the body, but we also check parsed body size below
  const contentLength = request.headers.get("Content-Length");
  if (contentLength && Number.parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
    return Response.json({ error: `Payload too large` }, { status: 413 });
  }

  const { data: rpcRequest, error: parseError } = await tryCatch(request.json());
  if (parseError) {
    console.warn("Invalid RPC request", parseError);
    return Response.json({ error: "Invalid RPC request" }, { status: 400 });
  }

  // Check actual payload size after parsing
  const serializedSize = new TextEncoder().encode(JSON.stringify(rpcRequest)).length;
  if (serializedSize > MAX_PAYLOAD_BYTES) {
    return Response.json({ error: `Payload too large` }, { status: 413 });
  }

  const isBatch = Array.isArray(rpcRequest);
  const requests = isBatch ? rpcRequest : [rpcRequest];

  // Check batch size (help prevent abuse)
  if (requests.length > APP_CONFIG.maxRpcBatchSize) {
    console.warn("Exceeds max batch size", requests.length);
    return Response.json({ error: "Exceeds max batch size" }, { status: 400 });
  }

  // Validate all requests
  for (const req of requests) {
    if (!req?.method || !ALLOWED_RPC_METHODS.includes(req.method as AllowedRpcMethodName)) {
      console.warn(`Blocked RPC method: ${req?.method}`);
      return Response.json({ error: "Method not supported" }, { status: 404 });
    }
  }

  const { data, error: requestError } = await tryCatch(makeRpcRequestWithFallbacks(rpcRequest, rpcUrls));
  if (requestError) {
    console.error("Failed to fetch RPC response", requestError);
    return Response.json({ error: "Failed to fetch RPC response" }, { status: 500 });
  }

  return Response.json(data);
}

// This sequentially fallsback on each url in rpcUrls if the request fails
// biome-ignore lint/suspicious/noExplicitAny: Allow any here, the RPC request itself will validate it's valid
async function makeRpcRequestWithFallbacks(rpcRequest: any, rpcUrls: string[]) {
  let lastError: Error | null = null;
  for (const url of rpcUrls) {
    const { data, error: requestError } = await tryCatch(
      fetchJsonResponse(url, {
        requestOptions: {
          method: "POST",
          body: JSON.stringify(rpcRequest),
          next: {
            revalidate: 0,
          },
          signal: AbortSignal.timeout(4_000), // 4s timeout
        },
        retryOptionOverrides: "disabled", // Client should handle retries
      }),
    );
    if (requestError) {
      lastError = requestError;
      continue;
    }

    return data;
  }

  throw lastError ?? new Error("All RPC endpoints failed");
}
