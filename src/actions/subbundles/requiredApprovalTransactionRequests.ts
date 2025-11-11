import { type Address, encodeFunctionData, erc20Abi } from "viem";
import { TOKENS_REQUIRING_APPROVAL_REVOCATION } from "../constants";
import type { TransactionRequest } from "../types";

interface RequiredApprovalTransactionParameters {
  readonly approvalTransactionName: string;
  readonly chainId: number;
  readonly erc20Address: Address;
  readonly spenderAddress: Address;
  readonly currentAllowance: bigint;
  readonly requiredAllowance: bigint;
}

// Builds the approval transactions required to allow spenderAddress to spend requiredAllowance of erc20Address on chainId
// This will be an empty array if the current allowance is sufficient, and revoke existing approvals before approving the new allowance if required
export function requiredApprovalTransactionRequests({
  approvalTransactionName,
  chainId,
  erc20Address,
  spenderAddress,
  currentAllowance,
  requiredAllowance,
}: RequiredApprovalTransactionParameters) {
  // If allowance is already sufficent, there is no transactions needed
  if (currentAllowance >= requiredAllowance) {
    return [];
  }

  const transactionRequests: TransactionRequest[] = [];

  // Revoke existing approval if required
  if (currentAllowance > 0n && TOKENS_REQUIRING_APPROVAL_REVOCATION[chainId]?.[erc20Address]) {
    transactionRequests.push({
      name: "Revoke existing approval",
      tx: () => ({
        to: erc20Address,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [spenderAddress, 0n],
        }),
      }),
    });
  }

  // Approve spender to spend requiredAllowance of erc20Address
  transactionRequests.push({
    name: approvalTransactionName,
    tx: () => ({
      to: erc20Address,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [spenderAddress, requiredAllowance],
      }),
    }),
  });

  return transactionRequests;
}
