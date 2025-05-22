"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useModal } from "connectkit";
import { ReactNode, createContext, useCallback, useContext, useState } from "react";
import { Hex } from "viem";
import { estimateGas, sendTransaction, waitForTransactionReceipt } from "viem/actions";
import { useAccount, useConnectorClient, usePublicClient, useSwitchChain } from "wagmi";

import { SuccessfulAction } from "@/actions/utils/types";
import { trackEvent } from "@/data/trackEvent";
import { fetchJsonResponse } from "@/utils/promise";

export type ActionFlowState = "review" | "active" | "success" | "failed";
export type ActionState = "pending-wallet" | "pending-transaction";

// Gives buffer on gas estimate to help prevent out of gas error
// For wallets that decide to respect this...
const GAS_BUFFER = 0.3;

type ActionFlowContextType = {
  chainId: number;

  flowState: ActionFlowState;
  activeStep: number;
  actionState: ActionState;

  lastTransactionHash: Hex | null;
  error: string | null;

  action: SuccessfulAction;

  startFlow: () => void;
};

const ActionFlowContext = createContext<ActionFlowContextType | undefined>(undefined);

interface ActionFlowProviderProps {
  chainId: number;
  action: SuccessfulAction;
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

  const { data: client } = useConnectorClient({ chainId });
  const { connector } = useAccount();
  const { setOpen: setConnectKitOpen } = useModal();

  const publicClient = usePublicClient({ chainId });
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
    if (accountChainId != chainId) {
      const { id } = await switchChainAsync({ chainId });
      if (id != chainId) {
        throw new Error("Unable to automaitcally switch chains.");
      }
    }

    if (flowState == "review") {
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

      try {
        for (const step of action.signatureRequests) {
          await step.sign(client);
          setActiveStep((step) => step + 1);
        }

        for (const step of action.transactionRequests) {
          setActionState("pending-wallet");

          const txReq = step.tx();

          let gasEstimateWithBuffer: bigint;
          try {
            // Uses public client instead so estimate happens throught our reliable RPC provider
            const gasEstimate = await estimateGas(publicClient, { ...txReq, account: client.account });
            gasEstimateWithBuffer = (gasEstimate * BigInt((1 + GAS_BUFFER) * 1000)) / BigInt(1000);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            void trackEvent("tx-gas-estimate-failed", {
              accountAddress,
              connector: connectorName,
              error: errorMessage,
              stepName: step.name,
              ...trackingPayload,
            });

            setError("Error: Unable to estimate gas. Please try again.");
            setFlowState("review");
            return;
          }

          const hash = await sendTransaction(client, { ...txReq, gas: gasEstimateWithBuffer });
          setLastTransactionHash(hash);
          void trackEvent("transaction", {
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
            pollingInterval: 4000,
            retryCount: 20,
          });

          if (receipt.status == "success") {
            void trackEvent("transaction", {
              accountAddress,
              hash,
              status: "success",
              connector: connectorName,
              stepName: step.name,
              ...trackingPayload,
            });
            setActiveStep((step) => step + 1);

            // Trigger data revalidation
            // void revalidatePages();
            void queryClient.invalidateQueries({ type: "all" });
            void queryClient.refetchQueries({ type: "all" });
          } else {
            void trackEvent("transaction", {
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
        // TODO: Parse this error
        const errorMessage = error instanceof Error ? error.message : String(error);
        setError(errorMessage);
        setFlowState("review");
        void trackEvent("transaction-flow-error", {
          accountAddress,
          connector: connectorName,
          error: errorMessage,
          ...trackingPayload,
        });
        return;
      }

      setFlowState("success");
      flowCompletionCb?.();
    }
  }, [
    flowState,
    setFlowState,
    setActionState,
    setActiveStep,
    setLastTransactionHash,
    setError,
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
