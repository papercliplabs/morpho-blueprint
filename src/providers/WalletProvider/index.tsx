"use client";
import { createAppKit } from "@reown/appkit/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { type ReactNode } from "react";
import { type Config, WagmiProvider, cookieToInitialState } from "wagmi";

import { LINKS, METADATA } from "@/config";

import { customRpcUrls, networks, projectId, wagmiAdapter } from "./wagmi";

const queryClient = new QueryClient();

const metadata = {
  name: METADATA.appName,
  description: METADATA.appDescription,
  url: process.env.NEXT_PUBLIC_URL!, // Origin must match domain & subdomain
  icons: [METADATA.appIcon],
};

// Modal config
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  metadata,
  features: {
    analytics: true,
    swaps: false,
    onramp: false,
    legalCheckbox: true,
    email: false,
    socials: false,
    send: false,
  },
  termsConditionsUrl: LINKS.termsOfService,
  privacyPolicyUrl: LINKS.privacyPolicy,
  customRpcUrls,
  enableNetworkSwitch: false,
});

export function WalletProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
