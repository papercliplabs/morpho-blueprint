"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogDrawer, DialogDrawerContent, DialogDrawerTitle } from "@/components/ui/dialog-drawer";
import { APP_CONFIG } from "@/config";
import { useAcknowledgeTermsContext } from "../../providers/AcknowledgeTermsProvider";
import { Label } from "../ui/label";

interface AcknowledgeTermsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AcknowledgeTerms(props: AcknowledgeTermsProps) {
  const { open, onOpenChange } = props;
  const { setAcknowledgement } = useAcknowledgeTermsContext();
  const [checked, setChecked] = useState(false);

  if (!APP_CONFIG.compliance.termsOfUse) {
    return null;
  }

  return (
    <DialogDrawer open={open} onOpenChange={onOpenChange}>
      <DialogDrawerContent className="w-full gap-6 bg-card lg:max-w-[640px]">
        <DialogDrawerTitle>Acknowledge Terms</DialogDrawerTitle>
        <div className="body-large mt-2 flex max-h-[280px] flex-col gap-6 overflow-y-auto border bg-background p-6 lg:max-h-[400px]">
          {APP_CONFIG.compliance.termsOfUse}
        </div>
        <div className="flex gap-4">
          <Checkbox
            id="acknowledge-terms"
            checked={checked}
            onCheckedChange={(checked) => setChecked(checked === "indeterminate" ? false : checked)}
          />
          <Label htmlFor="acknowledge-terms" className="body-small text-muted-foreground">
            By checking this box, you agree to the{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Use
            </Link>
            {APP_CONFIG.compliance.privacyPolicy && (
              <>
                , and{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </>
            )}
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
