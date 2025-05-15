import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { getMarketSummaries } from "@/data/whisk/getMarketSummaries";

export default function BorrowPage() {
  return (
    <div className="flex flex-col">
      <h1>Borrow</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <ExampleWrapper />
      </Suspense>
    </div>
  );
}

async function ExampleWrapper() {
  const markets = await getMarketSummaries();

  return (
    <div>
      <div className="flex flex-row gap-2">
        {markets.map((market, i) => (
          <Link key={i} href={`/borrow/${market.chain.id}/${market.marketId}`}>
            <Button>{market.name}</Button>
          </Link>
        ))}
      </div>
      <pre>{JSON.stringify(markets, null, 2)}</pre>
    </div>
  );
}
