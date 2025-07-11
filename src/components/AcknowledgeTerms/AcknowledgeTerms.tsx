"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogDrawer, DialogDrawerContent, DialogDrawerTitle } from "@/components/ui/dialog-drawer";
import Link from "next/link";
import { PropsWithChildren, useState } from "react";
import { Label } from "../ui/label";
import { useAcknowledgeTermsContext } from "./AcknowledgeTermsProvider";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AcknowledgeTerms(props: PropsWithChildren<Props>) {
  const { open, onOpenChange, children } = props;
  const { setAcknowledgement } = useAcknowledgeTermsContext();
  const [checked, setChecked] = useState(false);

  return (
    <DialogDrawer open={open} onOpenChange={onOpenChange}>
      <DialogDrawerContent className="bg-card w-full max-w-[640px] gap-6">
        <DialogDrawerTitle>Acknowledge Terms</DialogDrawerTitle>
        <div className="bg-background body-large mt-2 flex max-h-[280px] flex-col gap-6 overflow-y-auto border p-6 md:max-h-[400px]">
          {children}
        </div>
        <div className="flex gap-4">
          <Checkbox
            id="acknowledge-terms"
            checked={checked}
            onCheckedChange={(checked) => setChecked(checked === "indeterminate" ? false : checked)}
          />
          <Label htmlFor="acknowledge-terms" className="body-small text-muted-foreground">
            By checking this box, you agree to the{" "}
            <Link href="/terms" className="text-primary">
              Terms of Use
            </Link>
            ,{" "}
            <Link href="/privacy" className="text-primary">
              Privacy Policy
            </Link>
            , and{" "}
            <Link href="/cookies" className="text-primary">
              Cookie Policy
            </Link>
            , and confirm that you are not a resident of any prohibited jurisdictions.
          </Label>
        </div>
        <div className="mt-2 flex gap-3">
          <Button variant="secondary" size="lg" className="flex-1" onClick={() => onOpenChange(false)}>
            Reject
          </Button>
          <Button size="lg" className="flex-1" disabled={!checked} onClick={setAcknowledgement}>
            Accept
          </Button>
        </div>
      </DialogDrawerContent>
    </DialogDrawer>
  );
}
