import { getAddress } from "viem";

import { getWalletIsOfacSanctioned } from "@/modules/compliance/data/getWalletIsOfacSanctioned";

export async function GET(_request: Request, { params }: { params: Promise<{ accountAddress: string }> }) {
  const accountAddress = getAddress((await params).accountAddress);
  const isOfacSanctioned = await getWalletIsOfacSanctioned(accountAddress);
  return Response.json(isOfacSanctioned);
}
