import Link from "next/link";
import { PoweredByMorpho } from "@/components/PoweredByMorpho";
import { APP_CONFIG } from "@/config";
import LinkExternal from "../LinkExternal";
import { ThemeToggle } from "./ThemeToggle";

const { footerLinks } = APP_CONFIG;
const { termsOfUse, privacyPolicy } = APP_CONFIG.legal;

const FOOTER_ITEMS: { text: string; href: string; internal?: boolean }[] = [
  ...(footerLinks ?? []),
  ...(termsOfUse ? [{ text: "Terms", href: "/terms", internal: true }] : []),
  ...(privacyPolicy ? [{ text: "Privacy", href: "/privacy", internal: true }] : []),
];

export function Footer() {
  return (
    <footer className="mb-18 flex w-full items-start justify-between gap-6 py-6 text-muted-foreground md:items-center lg:mb-0">
      <div className="flex min-h-9 flex-col items-center gap-6 md:flex-row">
        <LinkExternal href="https://morpho.org/" keepReferrer className="text-current">
          <PoweredByMorpho showTooltip={false} />
        </LinkExternal>
        {FOOTER_ITEMS.map((item) => {
          const Element = item.internal ? Link : LinkExternal;
          return (
            <Element key={item.text} href={item.href} className="span text-current hover:underline">
              {item.text}
            </Element>
          );
        })}
      </div>

      {APP_CONFIG.featureFlags.darkModeToggle && <ThemeToggle />}
    </footer>
  );
}
