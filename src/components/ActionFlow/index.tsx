"use client";
import { X } from "lucide-react";
import { motion } from "motion/react";
import { ComponentProps, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { zeroHash } from "viem";

import { SuccessfulAction } from "@/actions/utils/types";
import { capitalizeFirstLetter } from "@/utils/format";

import { Button } from "../ui/button";
import { DialogDrawer, DialogDrawerContent, DialogDrawerTitle } from "../ui/dialog-drawer";
import { ErrorMessage } from "../ui/error-message";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/seperator";

import { ActionFlowCompletion } from "./ActionFlowCompletion";
import { ActionFlowProvider, useActionFlowContext } from "./ActionFlowProvider";
import { ActionFlowSteps } from "./ActionFlowSteps";

interface ActionFlowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionName: string;
  summary: ReactNode;
  metrics: ReactNode;
}

export interface ActionFlowProps
  extends Omit<ComponentProps<typeof ActionFlowProvider>, "children" | "action">,
    ActionFlowDialogProps {
  action: SuccessfulAction | null;
}

export function ActionFlow({
  open,
  onOpenChange,
  actionName,
  summary,
  metrics,
  action,
  ...providerProps
}: ActionFlowProps) {
  const [render, setRender] = useState<boolean>(open);

  // Falling edge delay so we get the nice close animation
  useEffect(() => {
    if (open) {
      setRender(true);
      return;
    }

    const timeout = setTimeout(() => {
      setRender(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [open, action]);

  // Don't render at all if not open to let react lifecycle reset the flow provider
  return (
    render &&
    action && (
      <ActionFlowProvider {...providerProps} action={action}>
        <ActionFlowDialog
          actionName={actionName}
          summary={summary}
          metrics={metrics}
          open={open}
          onOpenChange={onOpenChange}
        />
      </ActionFlowProvider>
    )
  );
}

function ActionFlowDialog({ open, onOpenChange, actionName, summary, metrics }: ActionFlowDialogProps) {
  const { flowState, lastTransactionHash, error, startFlow } = useActionFlowContext();
  const preventClose = useMemo(() => flowState == "active", [flowState]);

  // useMeasure caused issues getting accurate height on initial render of dialog, this works instead
  const measureRef = useRef<HTMLDivElement>(null);
  const [measuredHeight, setMeasuredHeight] = useState<number | undefined>();
  useEffect(() => {
    if (!open) return;

    const raf = requestAnimationFrame(() => {
      if (measureRef.current) {
        const height = measureRef.current.scrollHeight;
        setMeasuredHeight(height);
      }
    });

    return () => cancelAnimationFrame(raf);
  }, [open, flowState]);

  const content = useMemo(() => {
    switch (flowState) {
      case "review":
        return (
          <>
            <DialogDrawerTitle>Review</DialogDrawerTitle>
            {summary}
            <Separator />
            {metrics}
            <div className="flex w-full min-w-0 flex-col gap-1">
              <Button onClick={startFlow} className="w-full">
                {actionName}
              </Button>
              <ErrorMessage message={error} />
            </div>
          </>
        );

      case "active":
        return (
          <>
            <DialogDrawerTitle>Confirm</DialogDrawerTitle>
            {summary}
            <Separator />
            <ActionFlowSteps />
          </>
        );

      case "success":
      case "failed":
        return (
          <>
            <DialogDrawerTitle>{capitalizeFirstLetter(flowState)}</DialogDrawerTitle>
            <ActionFlowCompletion status={flowState} transactionHash={lastTransactionHash ?? zeroHash} />
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </>
        );
    }
  }, [startFlow, flowState, error, actionName, metrics, summary, lastTransactionHash, onOpenChange]);

  return (
    <DialogDrawer open={open} onOpenChange={onOpenChange} dismissible={!preventClose}>
      <DialogDrawerContent hideCloseButton className="p-0 md:max-w-[420px]">
        <motion.div
          animate={{ height: measuredHeight ? measuredHeight : undefined }}
          transition={{ duration: 0.4, type: "spring", bounce: 0 }}
          className="min-w-0 overflow-hidden"
        >
          <div className="absolute top-2 right-2">
            <ActionFlowDialogCloseButton close={() => onOpenChange(false)} />
          </div>

          <div ref={measureRef} className="flex min-w-0 flex-col gap-6 p-6" key={flowState}>
            {content}
          </div>
        </motion.div>
      </DialogDrawerContent>
    </DialogDrawer>
  );
}

function ActionFlowDialogCloseButton({ close }: { close: () => void }) {
  const { flowState } = useActionFlowContext();
  const preventClose = useMemo(() => flowState == "active", [flowState]);
  const [popoverOpen, setPopoverOpen] = useState(false);

  return (
    <>
      <Popover open={popoverOpen}>
        <PopoverTrigger />
        <PopoverContent className="flex max-w-[256px] flex-col gap-6 text-center" side="top">
          <div className="heading-6 w-full">Cancel transaction</div>
          <p className="text-muted-foreground">
            If you close this modal, your transaction will be canceled, and you&apos;ll need to start over.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              variant="destructive"
              onClick={() => {
                close();
                setPopoverOpen(false);
              }}
            >
              Cancel Transaction
            </Button>
            <Button variant="ghost" onClick={() => setPopoverOpen(false)}>
              Go back
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Button onClick={() => (preventClose ? setPopoverOpen(true) : close())} variant="ghost">
        <X className="stroke-foreground h-4 w-4 shrink-0" />
      </Button>
    </>
  );
}
