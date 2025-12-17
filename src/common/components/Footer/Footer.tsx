import Link from "next/link";
import { PoweredByMorpho } from "@/common/components/PoweredByMorpho";
import { APP_CONFIG } from "@/config";
import LinkExternal, { LinkExternalUnstyled } from "../LinkExternal";
import { ThemeToggle } from "./ThemeToggle";

const { footerLinks } = APP_CONFIG.ui;
const { termsOfUse, privacyPolicy } = APP_CONFIG.compliance;

const FOOTER_ITEMS: { text: string; href: string; internal?: boolean }[] = [
  ...(footerLinks ?? []),
  ...(termsOfUse ? [{ text: "Terms", href: "/terms", internal: true }] : []),
  ...(privacyPolicy ? [{ text: "Privacy", href: "/privacy", internal: true }] : []),
];

export function Footer() {
  return (
    <footer className="mb-18 flex w-full items-start justify-between gap-6 py-6 text-muted-foreground md:items-center lg:mb-0">
      <div className="flex min-h-9 flex-col gap-6 md:flex-row md:items-center">
        <LinkExternal href="https://morpho.org/" keepReferrer className="text-current">
          <PoweredByMorpho showTooltip={false} />
        </LinkExternal>
        {FOOTER_ITEMS.map((item) => {
          const Element = item.internal ? Link : LinkExternalUnstyled;
          return (
            <Element key={item.text} href={item.href} className="span text-start text-current hover:underline">
              {item.text}
            </Element>
          );
        })}
      </div>

      {APP_CONFIG.featureFlags.enableDarkModeToggle && <ThemeToggle />}
    </footer>
  );
}
