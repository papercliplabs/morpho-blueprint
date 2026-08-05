import "server-only";

import { cache } from "react";
import { createPublicClient, fallback, getAddress, http } from "viem";
import { mainnet } from "viem/chains";

// Chainalysis's public sanctions oracle, which screens against the OFAC SDN list.
// Pinned to mainnet: the screening result is chain independent, so it is read here regardless of
// which chain the action being gated targets.
// https://go.chainalysis.com/chainalysis-oracle-docs.html
const SANCTIONS_ORACLE_ADDRESS = getAddress("0x40C57923924B5c5c5455c48D93317139ADDaC8fb");

const SANCTIONS_ORACLE_ABI = [
  {
    type: "function",
    name: "isSanctioned",
    stateMutability: "view",
    inputs: [{ name: "addr", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

// This gates the start of every transaction flow, so the read is kept short: two attempts of
// RPC_TIMEOUT_MS each, ~8s worst case.
const RPC_TIMEOUT_MS = 4_000;

// Read against the configured mainnet RPC URLs directly rather than through the app's
// /api/rpc/[chainId] proxy: the proxy requires an Origin header, so it rejects server-to-server
// calls, and under the fail-closed semantics below that would block every transaction.
function getMainnetTransport() {
  const rpcUrls = [process.env.MAINNET_RPC_URL_1, process.env.MAINNET_RPC_URL_2].filter((url) => !!url);
  if (rpcUrls.length === 0) {
    throw new Error("No mainnet RPC URL configured");
  }
  // Spend the same two attempts either way: across both providers when two are configured, or on a
  // retry of the only one when it is alone. Deployments that configure a single RPC URL would
  // otherwise turn any transient blip into a blocked transaction, since this read fails closed.
  return fallback(
    rpcUrls.map((url) => http(url, { timeout: RPC_TIMEOUT_MS, retryCount: 0 })),
    { retryCount: rpcUrls.length > 1 ? 0 : 1 },
  );
}

/**
 * Whether a wallet is sanctioned according to Chainalysis's on-chain sanctions oracle.
 *
 * Fails closed: any failure — a malformed address, missing RPC configuration, or an RPC error —
 * reports the wallet as sanctioned, since a screening result that cannot be established must not
 * let a transaction through.
 */
export const getWalletIsSanctioned = cache(async (address: string): Promise<boolean> => {
  try {
    const client = createPublicClient({ chain: mainnet, transport: getMainnetTransport() });
    return await client.readContract({
      address: SANCTIONS_ORACLE_ADDRESS,
      abi: SANCTIONS_ORACLE_ABI,
      functionName: "isSanctioned",
      args: [getAddress(address)],
    });
  } catch (error) {
    console.error(`Unable to screen ${address} against the sanctions oracle, failing closed`, error);
    return true;
  }
});
