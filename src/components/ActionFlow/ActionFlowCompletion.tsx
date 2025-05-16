"use client";
import { Check, X } from "lucide-react";
import { useMemo } from "react";
import { Hex } from "viem";
import { usePublicClient } from "wagmi";

import LinkExternal from "../LinkExternal";

import { useActionFlowContext } from "./ActionFlowProvider";

interface ActionFlowCompletionProps {
  status: "success" | "failed";
  transactionHash: Hex;
}

export function ActionFlowCompletion({ status, transactionHash }: ActionFlowCompletionProps) {
  const { chainId } = useActionFlowContext();
  const publicClient = usePublicClient({ chainId });

  const content = useMemo(() => {
    switch (status) {
      case "success":
        return (
          <>
            <div className="bg-primary flex size-16 items-center justify-center rounded-full">
              <Check className="stroke-primary-foreground size-8" />
            </div>
            <span>Transaction successful! You can now close this dialog or view details on the explorer.</span>
          </>
        );
      case "failed":
        return (
          <>
            <div className="bg-destructive flex size-16 items-center justify-center rounded-full">
              <X className="stroke-primary-foreground size-8" />
            </div>
            <span>Transaction failed.</span>
          </>
        );
    }
  }, [status]);

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex w-full flex-col items-center gap-4">{content}</div>
      <LinkExternal href={`${publicClient?.chain.blockExplorers?.default.url}/tx/${transactionHash}`}>
        View on Explorer
      </LinkExternal>
    </div>
  );
}
