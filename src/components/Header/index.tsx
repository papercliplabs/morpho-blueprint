import Link from "next/link";

import { Nav } from "./Nav";

function Header() {
  return (
    <header className="h-header bg-background-primary sticky top-0 z-[20] flex w-full items-center justify-center backdrop-blur-xl">
      <div className="flex w-full max-w-screen-xl flex-col gap-2 p-4 pb-2 md:pb-4">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-4 md:gap-6">
            <Link href="/" className="group flex items-center gap-1">
              Logo
            </Link>
            <div className="hidden md:block">
              <Nav />
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">TODO</div>
        </div>
        <div className="md:hidden">
          <Nav />
        </div>
      </div>
    </header>
  );
}

export { Header };
