import { AppKitNetwork } from "@reown/appkit/networks";
import { CaipNetworkId } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { HttpTransportConfig } from "viem";
import { cookieStorage, createStorage } from "wagmi";

import { NETWORK_CONFIGS } from "@/config";

export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID!;
export const networks = NETWORK_CONFIGS.map(({ network }) => network) as [AppKitNetwork, ...AppKitNetwork[]];

type CustomRpcUrl = {
  url: string;
  config?: HttpTransportConfig; // Optional transport configuration
};
type CustomRpcUrlMap = Record<CaipNetworkId, CustomRpcUrl[]>;
export const customRpcUrls: CustomRpcUrlMap = NETWORK_CONFIGS.reduce((acc, { network, rpcUrls }) => {
  acc[`eip155:${network.id}`] = rpcUrls.map((url) => ({ url }));
  return acc;
}, {} as CustomRpcUrlMap);

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
  customRpcUrls,
});

export const config = wagmiAdapter.wagmiConfig;
