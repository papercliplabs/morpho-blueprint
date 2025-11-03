"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useModal } from "connectkit";
import { createContext, type ReactNode, useCallback, useContext, useState } from "react";
import { BaseError, type Hex, RpcError } from "viem";
import { estimateGas, sendTransaction, waitForTransactionReceipt } from "viem/actions";
import { useAccount, useClient, useConnectorClient, useSwitchChain } from "wagmi";

import type { Action } from "@/actions";
import { trackEvent } from "@/data/trackEvent";
import { fetchJsonResponse } from "@/utils/fetch";

export type ActionFlowState = "review" | "active" | "success" | "failed";
export type ActionState = "pending-wallet" | "pending-transaction";

// Gives buffer on gas estimate to help prevent out of gas error
// For wallets that decide to respect this...
const GAS_BUFFER = 0.3;
const USER_REJECT_MSG = "Transaction cancelled.";

type ActionFlowContextType = {
  chainId: number;

  flowState: ActionFlowState;
  activeStep: number;
  actionState: ActionState;

  lastTransactionHash: Hex | null;
  error: string | null;

  action: Action;

  startFlow: () => void;
};

const ActionFlowContext = createContext<ActionFlowContextType | undefined>(undefined);

interface ActionFlowProviderProps {
  chainId: number;
  action: Action;
  flowCompletionCb?: () => void;
  children: ReactNode;

  trackingPayload: {
    tag: string;
  } & Record<string, string | number>;
}

export function ActionFlowProvider({
  chainId,
  flowCompletionCb,
  action,
  trackingPayload,
  children,
}: ActionFlowProviderProps) {
  const [flowState, setFlowState] = useState<ActionFlowState>("review");
  const [activeStep, setActiveStep] = useState<number>(0);
  const [actionState, setActionState] = useState<ActionState>("pending-wallet");
  const [lastTransactionHash, setLastTransactionHash] = useState<Hex | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: client } = useConnectorClient({ chainId, assertChainId: false });
  const { connector } = useAccount();
  const { setOpen: setConnectKitOpen } = useModal();

  const publicClient = useClient({ chainId });
  const { switchChainAsync } = useSwitchChain();
  const queryClient = useQueryClient();
  const { chainId: accountChainId } = useAccount();

  const startFlow = useCallback(async () => {
    // Must be connected
    if (!client || !publicClient) {
      setConnectKitOpen(true);
      return;
    }

    // Must be on the correct chain
    if (accountChainId !== chainId) {
      const { id } = await switchChainAsync({ chainId });
      if (id !== chainId) {
        throw new Error("Unable to automaitcally switch chains.");
      }
    }

    if (flowState === "review") {
      // For tracking purposes to determine if we are seeing issues with a specific connector
      const connectorName = connector?.name ?? "unknown";
      const accountAddress = client.account.address;

      // Reset state
      setFlowState("active");
      //   setActiveStep(0); // Don't reset step, let's pick up where we left off.
      setActionState("pending-wallet");
      setLastTransactionHash(null);
      setError(null);

      const isOfacSanctioned = await fetchJsonResponse<boolean>(`/api/account/${accountAddress}/is-ofac-sanctioned`);
      if (isOfacSanctioned) {
        setError("This action is not available to OFAC sanctioned accounts.");
        setFlowState("review");
        return;
      }

      const remainingSignatureRequests = action.signatureRequests.slice(activeStep);
      const remainingTransactionRequests = action.transactionRequests.slice(
        Math.max(activeStep - action.signatureRequests.length, 0),
      );

      try {
        for (const step of remainingSignatureRequests) {
          await step.sign(client);
          setActiveStep((prev) => prev + 1);
        }

        for (const step of remainingTransactionRequests) {
          setActionState("pending-wallet");

          const txReq = step.tx();

          // Uses public client instead so estimate happens throught our reliable RPC provider
          const gasEstimate = await estimateGas(publicClient, { ...txReq, account: client.account });
          const gasEstimateWithBuffer = (gasEstimate * BigInt((1 + GAS_BUFFER) * 1000)) / BigInt(1000);

          const hash = await sendTransaction(client, { ...txReq, gas: gasEstimateWithBuffer });
          setLastTransactionHash(hash);
          void trackEvent("tx-pending", {
            accountAddress,
            hash,
            status: "pending",
            connector: connectorName,
            stepName: step.name,
            ...trackingPayload,
          });

          // Uses public client instead so polling happens through our RPC provider
          // Not the users wallet provider, which may be unreliable
          setActionState("pending-transaction");
          const receipt = await waitForTransactionReceipt(publicClient, {
            hash,
            pollingInterval: 1000,
            retryCount: 20,
          });

          if (receipt.status === "success") {
            void trackEvent("tx-success", {
              accountAddress,
              hash,
              status: "success",
              connector: connectorName,
              stepName: step.name,
              ...trackingPayload,
            });
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Delay to let rpc data propogate (ex approval on prev tx)
            setActiveStep((prev) => prev + 1);
          } else {
            void trackEvent("tx-revert", {
              accountAddress,
              hash,
              status: "failed",
              connector: connectorName,
              stepName: step.name,
              ...trackingPayload,
            });
            setFlowState("failed");
            return;
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof BaseError ? parseViemError(error) : (error as Error).message || String(error);

        setError(errorMessage);
        setFlowState("review");

        void trackEvent("tx-flow-error", {
          accountAddress,
          connector: connectorName,
          error: errorMessage,
          ...trackingPayload,
        });
        return;
      }

      // Trigger data revalidation
      // void revalidatePages();
      void queryClient.invalidateQueries({ type: "all" });
      void queryClient.refetchQueries({ type: "all" });

      setFlowState("success");
      flowCompletionCb?.();
    }
  }, [
    flowState,
    client,
    publicClient,
    chainId,
    action,
    flowCompletionCb,
    switchChainAsync,
    connector,
    queryClient,
    setConnectKitOpen,
    accountChainId,
    trackingPayload,
    activeStep,
  ]);

  return (
    <ActionFlowContext.Provider
      value={{
        chainId,
        flowState,
        activeStep,
        actionState,
        lastTransactionHash,
        error,
        startFlow,
        action,
      }}
    >
      {children}
    </ActionFlowContext.Provider>
  );
}

export function useActionFlowContext() {
  const context = useContext(ActionFlowContext);
  if (!context) {
    throw new Error("useActionFlow must be used within an ActionFlow provider");
  }
  return context;
}

/**
 * Try to get a nice error message to display to the user for viem errors.
 *
 * We have special handling for user rejection, as this is a normal user action.
 * We can reliably detect rejection if one of the following is true:
 *   - The connected wallet conforms to EIP-1193 (error code 4001) - https://eips.ethereum.org/EIPS/eip-1193
 *   - The error details include "user reject" or "user cancel" (some non-conforming wallets like Rainbow)
 *
 * The only known wallet this doesn't work for is Family via WalletConnect which returns an UnknownRpcError with no relevant details.
 */
function parseViemError(error: BaseError): string {
  // Wallets that conform to EIP-1193 (MetaMask, Coinbase, Rabby, Rainbow, Zerion, Uniswap, ...)
  const eip1193UserReject = error.walk((err) => err instanceof RpcError && err.code === 4001);

  // Wallets that don't conform to EIP-1193 but have "user reject" or "user cancel" in the details (Rainbow)
  const detailsIncludesReject =
    error.details.toLowerCase().includes("user reject") || error.details.toLowerCase().includes("user cancel");

  const userReject = Boolean(eip1193UserReject) || detailsIncludesReject;

  // Nice reject message, or shortest provided error message
  return userReject ? USER_REJECT_MSG : error.shortMessage || error.message || error.details;
}
