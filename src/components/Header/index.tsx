import clsx from "clsx";
import Link from "next/link";
import { APP_CONFIG } from "@/config";
import { ConnectButton } from "../ConnectButton";
import { Rewards } from "../rewards/Rewards";
import { Nav } from "./Nav";

function Header() {
  return (
    <header className="sticky top-0 z-[20] flex h-header w-full flex-col items-center justify-center gap-2 bg-background-primary py-5 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1182px] items-center justify-between px-4">
        <div className="flex items-center gap-4 md:gap-6">
          <Link href={APP_CONFIG.ui.logo.link ?? "/earn"} className="transition-transform active:scale-98">
            <div className="hidden md:block">{APP_CONFIG.ui.logo.desktop}</div>
            <div className={clsx({ "md:hidden": !!APP_CONFIG.ui.logo.desktop })}>{APP_CONFIG.ui.logo.mobile}</div>
          </Link>
          <Nav />
        </div>
        <div className="flex items-center gap-1">
          <Rewards />
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}

export { Header };
