import clsx from "clsx";
import type { Metadata } from "next";

import Analytics from "@/components/Analytics";
import { Banner } from "@/components/Banner/Banner";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { APP_CONFIG } from "@/config";
import Providers from "@/providers";

import "./globals.css";

export const metadata: Metadata = {
  title: APP_CONFIG.appMetadata.name,
  description: APP_CONFIG.appMetadata.description,
  metadataBase: new URL(APP_CONFIG.appMetadata.url),
  openGraph: {
    url: APP_CONFIG.appMetadata.url,
    images: [
      {
        url: APP_CONFIG.appMetadata.images.opengraph,
        width: 1200,
        height: 630,
        type: "image/png",
      },
    ],
  },
  twitter: {
    images: [
      {
        url: APP_CONFIG.appMetadata.images.opengraph,
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
      { url: APP_CONFIG.appMetadata.images.icons.ico, type: "image/x-icon" },
      { url: APP_CONFIG.appMetadata.images.icons["png-64x64"], sizes: "64x64", type: "image/png" },
      { url: APP_CONFIG.appMetadata.images.icons.svg, type: "image/svg+xml" },
    ],
    apple: [{ url: APP_CONFIG.appMetadata.images.icons["png-192x192"], sizes: "192x192", type: "image/png" }],
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
          APP_CONFIG.fonts.main.variable,
          APP_CONFIG.fonts.others?.map((f) => f.variable),
          "antialiased",
        )}
      >
        <Providers>
          <div className="flex min-h-[100dvh] w-full flex-col items-center">
            {APP_CONFIG.banner && <Banner banner={APP_CONFIG.banner} />}
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
