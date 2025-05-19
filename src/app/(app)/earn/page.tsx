import { Suspense } from "react";

import { VaultTable } from "@/components/tables/VaultTable";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getVaultSummaries } from "@/data/whisk/getVaultSummaries";

export default function EarnPage() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <h1>Earn</h1>

      <Card className="min-w-0">
        <CardHeader>Vaults</CardHeader>
        <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
          <VaultTableWrapper />
        </Suspense>
      </Card>
    </div>
  );
}

async function VaultTableWrapper() {
  const vaultSummaries = await getVaultSummaries();
  return <VaultTable vaultSummaries={vaultSummaries} />;
}
