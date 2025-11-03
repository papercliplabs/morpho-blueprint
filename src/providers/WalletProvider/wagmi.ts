import { getDefaultConfig } from "connectkit";
import { type Chain, http } from "viem";
import { createConfig, type Transport } from "wagmi";

import { APP_CONFIG } from "@/config";

export const wagmiConfig = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: Object.values(APP_CONFIG.chainConfig).map(({ chain }) => chain) as [Chain, ...Chain[]],
    transports: Object.values(APP_CONFIG.chainConfig).reduce(
      (acc, { chain }) => {
        // RPCs use proxy route - use absolute URL for WalletConnect compatibility
        const rpcUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/api/rpc/${chain.id}`;
        acc[chain.id] = http(rpcUrl, {
          batch: {
            batchSize: APP_CONFIG.maxRpcBatchSize,
            wait: 16,
          },
        });
        return acc;
      },
      {} as Record<number, Transport>,
    ),

    walletConnectProjectId: APP_CONFIG.reownProjectId,

    appName: APP_CONFIG.metadata.name,

    appDescription: APP_CONFIG.metadata.description,
    appUrl: APP_CONFIG.metadata.url,
    appIcon: APP_CONFIG.metadata.images.icons.svg,

    // Supress wallet connect SSR error: "indexedDB is not defined".
    // https://github.com/WalletConnect/walletconnect-monorepo/issues/6841
    // This works becuase connectkit will use it's default when connectors is undefined.
    connectors: typeof indexedDB === "undefined" ? [] : undefined,

    ssr: true,
  }),
);
