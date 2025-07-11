import { PoweredByMorpho } from "@/components/PoweredByMorpho";
import { APP_CONFIG } from "@/config";

import LinkExternal from "../LinkExternal";

import { ThemeToggle } from "./ThemeToggle";

const { support, termsOfService, privacyPolicy } = APP_CONFIG.appMetadata.links;

const FOOTER_ITEMS: { name: string; href: string }[] = [
  ...(support ? [{ name: "Support", href: support }] : []),
  ...(termsOfService ? [{ name: "Terms", href: termsOfService }] : []),
  ...(privacyPolicy ? [{ name: "Privacy", href: privacyPolicy }] : []),
];

export function Footer() {
  return (
    <footer className="mb-18 flex w-full items-start justify-between gap-6 py-6 text-muted-foreground md:items-center lg:mb-0">
      <div className="flex min-h-9 flex-col gap-6 md:flex-row">
        <LinkExternal href="https://morpho.org/" keepReferrer className="text-current">
          <PoweredByMorpho showTooltip={false} />
        </LinkExternal>
        {FOOTER_ITEMS.map((item) => (
          <LinkExternal key={item.name} href={item.href} className="text-current">
            {item.name}
          </LinkExternal>
        ))}
      </div>

      {APP_CONFIG.featureFlags.darkModeToggle && <ThemeToggle />}
    </footer>
  );
}
