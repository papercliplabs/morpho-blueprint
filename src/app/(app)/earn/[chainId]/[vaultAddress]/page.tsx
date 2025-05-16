import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getAddress } from "viem";
import { Address } from "viem";

import VaultActions from "@/components/VaultActions";
import { WHITELISTED_VAULTS } from "@/config";
import { getVault } from "@/data/whisk/getVault";
import { VaultIdentifier } from "@/utils/types";

export default async function VaultPage({ params }: { params: Promise<{ chainId: string; vaultAddress: string }> }) {
  const { chainId: chainIdString, vaultAddress: vaultAddressString } = await params;
  let vaultAddress: Address;
  let chainId: number;
  try {
    vaultAddress = getAddress(vaultAddressString);
    chainId = parseInt(chainIdString);
  } catch {
    notFound();
  }

  if (!WHITELISTED_VAULTS[chainId].includes(vaultAddress)) {
    return <UnsupportedVault />;
  }

  return (
    <div className="flex flex-col">
      <h1>Vault</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <VaultActionsWrapper chainId={chainId} vaultAddress={vaultAddress} />
      </Suspense>
      {/* <Suspense fallback={<div>Loading...</div>}>
        <ExampleWrapper chainId={chainId} vaultAddress={vaultAddress} />
      </Suspense> */}
    </div>
  );
}

function UnsupportedVault() {
  return (
    <div className="flex w-full grow flex-col items-center justify-center gap-6 text-center">
      <h1>Unsupported Vault</h1>
      <p className="text-content-secondary">This vault is not currently supported on this interface.</p>
    </div>
  );
}

async function VaultActionsWrapper({ chainId, vaultAddress }: VaultIdentifier) {
  const vault = await getVault(chainId, vaultAddress);

  if (!vault) {
    return null;
  }

  return <VaultActions vault={vault} />;
}

// async function ExampleWrapper({ chainId, vaultAddress }: VaultIdentifier) {
//   const vault = await getVault(chainId, vaultAddress);

//   return (
//     <div>
//       <pre>{JSON.stringify(vault, null, 2)}</pre>
//     </div>
//   );
// }
