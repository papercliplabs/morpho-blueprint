"use client";
import clsx from "clsx";
import type { ReactNode } from "react";
import { APP_CONFIG } from "@/config";
import { cn } from "@/utils/shadcn";
import { LinkExternalUnstyled } from "../LinkExternal";
import { Button } from "../ui/button";

interface BannerProps {
  text: string;
  cta?: ReactNode;
  singleLineOnly?: boolean;
}

export function Banner({ text, cta, singleLineOnly }: BannerProps) {
  const hasCta = cta !== undefined;

  return (
    <div className="w-full bg-primary">
      <div
        className={cn("mx-auto flex max-w-[1182px] items-center px-4 py-2 text-primary-foreground", {
          "justify-between gap-4": hasCta,
          "justify-center": !hasCta,
        })}
      >
        <p className={clsx("body-medium", singleLineOnly ? "line-clamp-1" : "line-clamp-3")}>{text}</p>
        {cta !== undefined && cta}
      </div>
    </div>
  );
}

export function InfoBanner() {
  if (!APP_CONFIG.ui.infoBanner) {
    return null;
  }

  return (
    <Banner
      text={APP_CONFIG.ui.infoBanner.text}
      cta={
        APP_CONFIG.ui.infoBanner.link && (
          <LinkExternalUnstyled href={APP_CONFIG.ui.infoBanner.link.href}>
            <Button variant="secondary" size="sm">
              {APP_CONFIG.ui.infoBanner.link.text}
            </Button>
          </LinkExternalUnstyled>
        )
      }
    />
  );
}
