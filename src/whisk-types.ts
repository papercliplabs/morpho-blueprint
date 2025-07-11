// TODO: temp for now until we publish the Whisk API package

import {
  avalanche,
  base,
  berachain,
  bob,
  bsc,
  lisk,
  mainnet,
  optimism,
  plumeMainnet,
  polygon,
  sonic,
  unichain,
  worldchain,
} from "viem/chains";

export const SUPPORTED_CHAIN_IDS = [
  mainnet.id,
  polygon.id,
  sonic.id,
  avalanche.id,
  bsc.id, // Binance Smart Chain
  berachain.id,
  999, // hyperevm.id,
  plumeMainnet.id,

  // OP stack
  base.id,
  bob.id,
  optimism.id,
  worldchain.id,
  lisk.id,
  unichain.id,
] as const;

export type ChainId = (typeof SUPPORTED_CHAIN_IDS)[number];

export type { Address, Hex } from "viem";
export type BigIntish = string | bigint;
