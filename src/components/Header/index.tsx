import Link from "next/link";

import { Logo } from "@/config/components/Logo";

import { ConnectButton } from "../ConnectButton";

import { Nav } from "./Nav";

function Header() {
  return (
    <header className="h-header bg-background-primary sticky top-0 z-[20] flex w-full flex-col items-center justify-center gap-2 py-5 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1182px] items-center justify-between px-4">
        <div className="flex items-center gap-4 md:gap-6">
          <Link href="/earn" className="transition-transform active:scale-98">
            <Logo />
          </Link>
          <Nav />
        </div>
        <ConnectButton />
      </div>
    </header>
  );
}

export { Header };
