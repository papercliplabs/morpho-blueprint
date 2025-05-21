import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import Script from "next/script";

export default function Analytics() {
  return (
    <>
      <VercelAnalytics />
      {process.env.NEXT_PUBLIC_PLAUSIBLE_DATA_DOMAIN && process.env.NEXT_PUBLIC_PLAUSIBLE_BASE_URL && (
        <Script
          defer
          src={`${process.env.NEXT_PUBLIC_PLAUSIBLE_BASE_URL}/js/script.js`}
          data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DATA_DOMAIN}
        />
      )}
    </>
  );
}
