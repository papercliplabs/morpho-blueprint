"use client";
import { Check, X } from "lucide-react";
import { useMemo } from "react";
import type { Hex } from "viem";

import { LinkExternalBlockExplorer } from "../LinkExternal";

import { useActionFlowContext } from "./ActionFlowProvider";

interface ActionFlowCompletionProps {
  status: "success" | "failed";
  transactionHash: Hex;
}

export function ActionFlowCompletion({ status, transactionHash }: ActionFlowCompletionProps) {
  const { chainId } = useActionFlowContext();

  const content = useMemo(() => {
    switch (status) {
      case "success":
        return (
          <>
            <div className="flex size-16 items-center justify-center rounded-full bg-primary">
              <Check className="size-8 stroke-primary-foreground" />
            </div>
            <span>Transaction successful! You can now close this dialog or view details on the explorer.</span>
          </>
        );
      case "failed":
        return (
          <>
            <div className="flex size-16 items-center justify-center rounded-full bg-destructive">
              <X className="size-8 stroke-primary-foreground" />
            </div>
            <span>Transaction failed.</span>
          </>
        );
    }
  }, [status]);

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex w-full flex-col items-center gap-4">{content}</div>
      <LinkExternalBlockExplorer chainId={chainId} type="tx" txHash={transactionHash}>
        View on Explorer
      </LinkExternalBlockExplorer>
    </div>
  );
}
