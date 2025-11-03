import type { BundlerCall, SignatureRequirementFunction } from "@morpho-org/bundler-sdk-viem";
import type { Address, Chain, Client, Hex, Transport, TransactionRequest as ViemTransactionRequest } from "viem";

export type ClientWithChain = Client<Transport, Chain>;

export class UserFacingError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "UserFacingError";
  }
}

interface ActionMetadata {
  name: string;
}

export interface SignatureRequest extends ActionMetadata {
  sign: SignatureRequirementFunction;
}

export interface TransactionRequest extends ActionMetadata {
  tx: () => ViemTransactionRequest & {
    to: Address;
    data: Hex;
  };
}

export type Action = {
  signatureRequests: SignatureRequest[];
  transactionRequests: TransactionRequest[];
};

export type VaultAction = Action & { positionChange: VaultPositionChange };

export type MarketAction = Action & { positionChange: MarketPositionChange };

export interface Subbundle {
  signatureRequirements: SignatureRequest[];
  transactionRequirements: TransactionRequest[];
  bundlerCalls: () => BundlerCall[]; // Encode just in time so we can use signatures
}

export interface SimulatedValueChange<T> {
  before: T;
  after: T;
}

export type VaultPositionChange = {
  balance: SimulatedValueChange<bigint>;
};

export type MarketPositionChange = {
  collateral: SimulatedValueChange<bigint>;
  loan: SimulatedValueChange<bigint>;
  availableToBorrow: SimulatedValueChange<bigint>;
  ltv: SimulatedValueChange<bigint>;
};

export interface Erc4626SupplyActionParameters {
  client: ClientWithChain;
  vaultAddress: Address;
  accountAddress: Address;
  supplyAmount: bigint;
}

export interface Erc4626WithdrawActionParameters {
  client: ClientWithChain;
  vaultAddress: Address;
  accountAddress: Address;
  /** Pass maxUint256 for entire position balance (leaving no dust) */
  withdrawAmount: bigint;
}

export interface Position {
  shares: bigint;
  assets: bigint;
}
