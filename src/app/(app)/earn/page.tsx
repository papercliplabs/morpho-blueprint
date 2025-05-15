import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { getVaultSummaries } from "@/data/whisk/getVaultSummaries";

export default function EarnPage() {
  return (
    <div className="flex flex-col">
      <h1>Earn</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <ExampleWrapper />
      </Suspense>
    </div>
  );
}

async function ExampleWrapper() {
  const vaults = await getVaultSummaries();

  return (
    <div>
      <div className="flex flex-row gap-2">
        {vaults.map((vault, i) => (
          <Link key={i} href={`/earn/${vault.chain.id}/${vault.vaultAddress}`}>
            <Button>{vault.name}</Button>
          </Link>
        ))}
      </div>
      <pre>{JSON.stringify(vaults, null, 2)}</pre>
    </div>
  );
}
