import { getAddress } from "viem";

import { getVaultPositions } from "@/modules/vault/data/getVaultPositions";

export async function GET(_request: Request, { params }: { params: Promise<{ accountAddress: string }> }) {
  const accountAddress = getAddress((await params).accountAddress);
  const vaultPositions = await getVaultPositions(accountAddress);
  return Response.json(vaultPositions);
}
