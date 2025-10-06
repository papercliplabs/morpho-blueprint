// TODO: temp for now until we publish the Whisk API package

import {
  arbitrum,
  avalanche,
  base,
  berachain,
  bob,
  bsc,
  corn,
  hemi,
  katana,
  lisk,
  mainnet,
  optimism,
  plumeMainnet,
  polygon,
  soneium,
  sonic,
  tac,
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
  tac.id,
  arbitrum.id,
  hemi.id,
  corn.id,
  katana.id,

  // OP stack
  base.id,
  bob.id,
  optimism.id,
  worldchain.id,
  lisk.id,
  unichain.id,
  soneium.id,
] as const;

export type ChainId = (typeof SUPPORTED_CHAIN_IDS)[number];

export type { Address, Hex } from "viem";
export type BigIntish = string | bigint;
