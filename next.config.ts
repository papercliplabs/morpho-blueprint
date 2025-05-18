import type { NextConfig } from "next";

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline'
        https://plausible.paperclip.xyz;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src * 'self' data: blob: 
        https://walletconnect.org 
        https://walletconnect.com
        https://secure.walletconnect.com
        https://secure.walletconnect.org
        https://tokens-data.1inch.io 
        https://tokens.1inch.io
        https://ipfs.io
        https://cdn.zerion.io
        https://cdn.whisk.so
        https://cdn.morpho.org
        https://raw.githubusercontent.com/trustwallet/assets/**
        https://coin-images.coingecko.com/coins/images/**;
    font-src 'self' https://fonts.gstatic.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    connect-src 'self' 
        https://rpc.walletconnect.com
        https://rpc.walletconnect.org
        https://relay.walletconnect.com
        https://relay.walletconnect.org
        wss://relay.walletconnect.com
        wss://relay.walletconnect.org
        https://pulse.walletconnect.com
        https://pulse.walletconnect.org
        https://api.web3modal.com
        https://api.web3modal.org
        https://keys.walletconnect.com 
        https://keys.walletconnect.org 
        https://notify.walletconnect.com 
        https://notify.walletconnect.org 
        https://echo.walletconnect.com 
        https://echo.walletconnect.org 
        https://push.walletconnect.com 
        https://push.walletconnect.org 
        wss://www.walletlink.org
        https://*.alchemy.com
        https://*.infura.io
        https://*.quiknode.pro
        https://api.paraswap.io
        https://plausible.paperclip.xyz;
    frame-src 'self' 
        https://verify.walletconnect.com 
        https://verify.walletconnect.org 
        https://secure.walletconnect.com 
        https://secure.walletconnect.org;
    upgrade-insecure-requests;
    report-to csp-report-endpoint;
`;

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // TODO: reenable, but allow dev things for nextJS HMR...
          // {
          //   key: "Content-Security-Policy",
          //   value: cspHeader.replace(/\s{2,}/g, " ").trim(),
          // },
          {
            key: "Reporting-Endpoints",
            value: `csp-report-endpoint="${process.env.NEXT_PUBLIC_URL!}/api/csp-report"`,
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ];
  },
  redirects: async () => {
    return [
      {
        source: "/",
        destination: "/earn",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
