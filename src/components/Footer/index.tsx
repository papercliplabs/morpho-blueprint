import { LINKS } from "@/config";

import LinkExternal from "../LinkExternal";
import { PoweredByMorpho } from "../ui/icons/PoweredByMorpho";

import { ThemeToggle } from "./ThemeToggle";

const FOOTER_ITEMS: { name: string; href: string }[] = [
  { name: "Support", href: LINKS.support },
  { name: "Privacy", href: LINKS.termsOfService },
  { name: "Terms", href: LINKS.privacyPolicy },
];

export function Footer() {
  return (
    <footer className="text-muted-foreground flex w-full items-start justify-between gap-6 py-6 md:items-center">
      <div className="flex flex-col gap-6 md:flex-row">
        <LinkExternal href="https://morpho.org/" keepReferrer className="text-muted-foreground">
          <PoweredByMorpho />
        </LinkExternal>
        {FOOTER_ITEMS.map((item) => (
          <LinkExternal key={item.name} href={item.href} className="text-muted-foreground">
            {item.name}
          </LinkExternal>
        ))}
      </div>

      <ThemeToggle />
    </footer>
  );
}
