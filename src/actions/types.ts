import type { BundlerCall, SignatureRequirementFunction } from "@morpho-org/bundler-sdk-viem";
import type { Address, Client, Hex, PublicClient, TransactionRequest as ViemTransactionRequest } from "viem";

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

export type SuccessfulAction = {
  status: "success";
  signatureRequests: SignatureRequest[];
  transactionRequests: TransactionRequest[];
};

export type ErrorAction = {
  status: "error";
  message: string;
};

export type Action = SuccessfulAction | ErrorAction;

export type SuccessfulVaultAction = SuccessfulAction & { positionChange: VaultPositionChange };
export type VaultAction = SuccessfulVaultAction | ErrorAction;

export type SuccessfulMarketAction = SuccessfulAction & { positionChange: MarketPositionChange };
export type MarketAction = SuccessfulMarketAction | ErrorAction;

export type PublicClientWithChain = Client & { chain: NonNullable<PublicClient["chain"]> };

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
  balance: SimulatedValueChange<number>;
};

export type MarketPositionChange = {
  collateral: SimulatedValueChange<number>;
  loan: SimulatedValueChange<number>;
  availableToBorrow: SimulatedValueChange<number>;
  ltv: SimulatedValueChange<number>;
};
