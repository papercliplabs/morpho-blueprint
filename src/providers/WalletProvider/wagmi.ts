import { getDefaultConfig } from "connectkit";
import { Chain, FallbackTransport, fallback, http } from "viem";
import { createConfig } from "wagmi";

import { APP_CONFIG } from "@/config";

export const wagmiConfig = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: Object.values(APP_CONFIG.chainConfig).map(({ chain }) => chain) as [Chain, ...Chain[]],
    transports: Object.values(APP_CONFIG.chainConfig).reduce(
      (acc, { chain, rpcUrls }) => {
        acc[chain.id] = fallback(rpcUrls.map((url) => http(url)));
        return acc;
      },
      {} as Record<number, FallbackTransport>
    ),

    walletConnectProjectId: APP_CONFIG.reownProjectId,

    appName: APP_CONFIG.appMetadata.name,

    appDescription: APP_CONFIG.appMetadata.description,
    appUrl: APP_CONFIG.appMetadata.url,
    appIcon: APP_CONFIG.appMetadata.images.icons.svg,

    ssr: true,
  })
);
