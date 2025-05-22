import { AppKitNetwork } from "@reown/appkit/networks";
import { CaipNetworkId } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { HttpTransportConfig } from "viem";
import { cookieStorage, createStorage } from "wagmi";

import { APP_CONFIG } from "@/config";

export const networks = Object.values(APP_CONFIG.chainConfig).map(({ chain }) => chain) as [
  AppKitNetwork,
  ...AppKitNetwork[],
];

type CustomRpcUrl = {
  url: string;
  config?: HttpTransportConfig; // Optional transport configuration
};
type CustomRpcUrlMap = Record<CaipNetworkId, CustomRpcUrl[]>;
export const customRpcUrls: CustomRpcUrlMap = Object.values(APP_CONFIG.chainConfig).reduce(
  (acc, { chain, rpcUrls }) => {
    acc[`eip155:${chain.id}`] = rpcUrls.map((url) => ({ url }));
    return acc;
  },
  {} as CustomRpcUrlMap
);

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId: APP_CONFIG.reownProjectId,
  networks,
  customRpcUrls,
});

export const config = wagmiAdapter.wagmiConfig;
