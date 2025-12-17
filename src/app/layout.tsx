import clsx from "clsx";
import type { Metadata } from "next";
import { InfoBanner } from "@/common/components/Banner";
import { Footer } from "@/common/components/Footer/Footer";
import { Header } from "@/common/components/Header/Header";
import { APP_CONFIG } from "@/config";
import { CountrySpecificDisclaimer } from "@/modules/compliance/components/CountrySpecificDisclaimer";
import Providers from "./Providers";

import "./globals.css";

export const metadata: Metadata = {
  title: APP_CONFIG.metadata.name,
  description: APP_CONFIG.metadata.description,
  metadataBase: new URL(APP_CONFIG.metadata.url),
  openGraph: {
    url: APP_CONFIG.metadata.url,
    images: [
      {
        url: APP_CONFIG.metadata.images.opengraph,
        width: 1200,
        height: 630,
        type: "image/png",
      },
    ],
  },
  twitter: {
    images: [
      {
        url: APP_CONFIG.metadata.images.opengraph,
        width: 1200,
        height: 630,
        type: "image/png",
      },
    ],
  },
  alternates: {
    canonical: "./",
  },
  icons: {
    icon: [
      { url: APP_CONFIG.metadata.images.icons.ico, type: "image/x-icon" },
      { url: APP_CONFIG.metadata.images.icons["png-64x64"], sizes: "64x64", type: "image/png" },
      { url: APP_CONFIG.metadata.images.icons.svg, type: "image/svg+xml" },
    ],
    apple: [{ url: APP_CONFIG.metadata.images.icons["png-192x192"], sizes: "192x192", type: "image/png" }],
  },
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
          APP_CONFIG.ui.fonts.main.variable,
          APP_CONFIG.ui.fonts.others?.map((f) => f.variable),
          "antialiased",
        )}
      >
        <Providers>
          <div className="flex min-h-[100dvh] w-full flex-col items-center">
            <InfoBanner />
            <CountrySpecificDisclaimer />
            <Header />
            <div className="mx-auto flex w-full max-w-[1182px] grow flex-col justify-between px-4">
              <main className="flex w-full min-w-0 grow pt-8 md:pb-8">{children}</main>
              <Footer />
            </div>
          </div>
          {APP_CONFIG.analytics.component}
        </Providers>
      </body>
    </html>
  );
}

export const dynamic = "force-static";
export const revalidate = 300; // 5min
