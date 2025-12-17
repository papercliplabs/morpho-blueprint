"use client";

import { usePathname } from "next/navigation";

import { NavItem } from "./NavItem";

type NavItemType = {
  href: string;
  name: string;
  isActive: (pathname: string) => boolean;
};

const NAV_ITEMS: NavItemType[] = [
  { href: "/earn", name: "Earn", isActive: (pathname) => pathname.startsWith("/earn") },
  { href: "/borrow", name: "Borrow", isActive: (pathname) => pathname.startsWith("/borrow") },
];

function Nav() {
  const pathname = usePathname();

  return (
    <div className="flex w-full items-center gap-0.5 overflow-x-auto md:gap-1">
      {NAV_ITEMS.map((item) => (
        <NavItem key={item.href} href={item.href} name={item.name} active={item.isActive(pathname)} />
      ))}
    </div>
  );
}

export { Nav };
