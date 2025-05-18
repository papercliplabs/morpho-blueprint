import { notFound } from "next/navigation";
import { Suspense } from "react";
import { isHex } from "viem";

import MarketActions from "@/components/MarketActions";
import { WHITELISTED_MARKETS } from "@/config";
import { getMarket, isNonIdleMarket } from "@/data/whisk/getMarket";
import { MarketIdentifier } from "@/utils/types";

export default async function MarketPage({ params }: { params: Promise<{ chainId: string; marketId: string }> }) {
  const { chainId: chainIdString, marketId } = await params;
  let chainId: number;
  try {
    chainId = parseInt(chainIdString);
  } catch {
    notFound();
  }

  if (!isHex(marketId)) {
    notFound();
  }

  if (!WHITELISTED_MARKETS[chainId].includes(marketId)) {
    return <UnsupportedMarket />;
  }

  return (
    <div className="flex flex-col">
      <h1>Market</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <MarketActionsWrapper chainId={chainId} marketId={marketId} />
      </Suspense>
    </div>
  );
}

function UnsupportedMarket() {
  return (
    <div className="flex w-full grow flex-col items-center justify-center gap-6 text-center">
      <h1>Unsupported Market</h1>
      <p className="text-content-secondary">This market is not currently supported on this interface.</p>
    </div>
  );
}

async function MarketActionsWrapper({ chainId, marketId }: MarketIdentifier) {
  const market = await getMarket(chainId, marketId);

  if (!market || !isNonIdleMarket(market)) {
    return null;
  }

  return <MarketActions market={market} />;
}

// async function ExampleWrapper({ chainId, marketId }: MarketIdentifier) {
//   const vault = await getMarket(chainId, marketId);

//   return (
//     <div>
//       <pre>{JSON.stringify(vault, null, 2)}</pre>
//     </div>
//   );
// }
