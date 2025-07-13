"use client";

import { Button } from "@/components/ui/button";
import {
  DialogDrawer,
  DialogDrawerClose,
  DialogDrawerContent,
  DialogDrawerTitle,
  DialogDrawerTrigger,
} from "@/components/ui/dialog-drawer";
import { APP_CONFIG } from "@/config";
import { useCountryCode } from "@/hooks/useCountryCode";
import { Banner } from "../Banner/Banner";

export function CountrySpecificDisclaimer() {
  const { data: countryCode } = useCountryCode();

  if (!countryCode) {
    return null;
  }

  const data = APP_CONFIG.compliance.countrySpecificDisclaimer?.[countryCode];

  if (!data) {
    return null;
  }

  return <Banner text={`${data.title}: ${data.text}`} cta={<DisclaimerModal {...data} />} singleLineOnly />;
}

export function DisclaimerModal({ title, text }: { title: string; text: string }) {
  return (
    <DialogDrawer>
      <DialogDrawerTrigger asChild>
        <Button variant="secondary" size="sm">
          Read More
        </Button>
      </DialogDrawerTrigger>
      <DialogDrawerContent className="w-full gap-6 bg-card lg:max-w-[640px]">
        <DialogDrawerTitle>{title}</DialogDrawerTitle>
        <div className="body-large mt-2 flex max-h-[280px] flex-col gap-6 overflow-y-auto border bg-background p-6 lg:max-h-[min(400px,100dvh)]">
          {text}
        </div>
        <DialogDrawerClose asChild>
          <Button>Done</Button>
        </DialogDrawerClose>
      </DialogDrawerContent>
    </DialogDrawer>
  );
}
