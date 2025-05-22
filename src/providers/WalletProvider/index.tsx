"use client";
import { createAppKit } from "@reown/appkit/react";
import React, { type ReactNode } from "react";
import { type Config, WagmiProvider } from "wagmi";

import { APP_CONFIG } from "@/config";

import { customRpcUrls, networks, wagmiAdapter } from "./wagmi";

const metadata = {
  name: APP_CONFIG.metadata.appName,
  description: APP_CONFIG.metadata.appDescription,
  url: process.env.NEXT_PUBLIC_URL!, // Origin must match domain & subdomain
  icons: [APP_CONFIG.metadata.appIcon],
};

// Modal config
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId: APP_CONFIG.reownProjectId,
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
  termsConditionsUrl: APP_CONFIG.links.termsOfService,
  privacyPolicyUrl: APP_CONFIG.links.privacyPolicy,
  customRpcUrls,
  enableNetworkSwitch: false,
});

export function WalletProvider({ children }: { children: ReactNode }) {
  return <WagmiProvider config={wagmiAdapter.wagmiConfig as Config}>{children}</WagmiProvider>;
}
