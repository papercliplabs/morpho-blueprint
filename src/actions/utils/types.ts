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

export type VaultAction = (SuccessfulAction & { positionChange: VaultPositionChange }) | ErrorAction;

export type MarketAction =
  | (SuccessfulAction & {
      positionChange: MarketPositionChange;
    })
  | ErrorAction;

export type PublicClientWithChain = PublicClient & { chain: NonNullable<PublicClient["chain"]> };
