import { SignatureRequirementFunction } from "@morpho-org/bundler-sdk-viem";
import { Address, Hex, PublicClient, TransactionRequest as ViemTransactionRequest } from "viem";

import { MarketPositionChange, VaultPositionChange } from "./positionChange";

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

export type PublicClientWithChain = PublicClient & { chain: NonNullable<PublicClient["chain"]> };
