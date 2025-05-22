import clsx from "clsx";
import type { Metadata } from "next";

import Analytics from "@/components/Analytics";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { APP_CONFIG } from "@/config";
import Providers from "@/providers";

import "./globals.css";

export const metadata: Metadata = {
  title: APP_CONFIG.appMetadata.name,
  description: APP_CONFIG.appMetadata.description,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={clsx(
          APP_CONFIG.fonts.main.variable,
          APP_CONFIG.fonts.others?.map((f) => f.variable),
          "antialiased"
        )}
      >
        <Providers>
          <div className="flex min-h-[100dvh] w-full flex-col items-center">
            <Header />
            <div className="mx-auto flex w-full max-w-[1182px] grow flex-col justify-between px-4">
              <main className="flex w-full min-w-0 grow pt-8 md:pb-8">{children}</main>
              <Footer />
            </div>
          </div>
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}

export const dynamic = "force-static";
export const revalidate = 300; // 5min
