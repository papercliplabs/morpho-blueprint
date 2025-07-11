"use client";
import { useMemo } from "react";

import { Step } from "../ui/step";

import { useActionFlowContext } from "./ActionFlowProvider";

export function ActionFlowSteps() {
  const { activeStep, actionState, action } = useActionFlowContext();

  const metadatas = useMemo(() => {
    return [...action.signatureRequests, ...action.transactionRequests].map((request, i) => ({
      name: request.name,
      type: i < action.signatureRequests.length ? "signature" : "transaction",
    }));
  }, [action]);

  return (
    <div className="flex flex-col gap-4">
      {metadatas.map((metadata, i) => {
        const status =
          i === activeStep
            ? actionState === "pending-wallet"
              ? "active"
              : "pending"
            : i < activeStep
              ? "complete"
              : "upcoming";
        const labelPostfix = status === "active" ? " In wallet" : status === "pending" ? " Pending..." : "";
        return <Step number={i + 1} status={status} label={metadata.name + labelPostfix} key={metadata.name} />;
      })}
    </div>
  );
}
