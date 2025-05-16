import { getAddress } from "viem";

import { getAccountIsOfacSanctioned } from "@/data/whisk/getAccountIsOfacSantioned";

export async function GET(_request: Request, { params }: { params: Promise<{ accountAddress: string }> }) {
  const accountAddress = getAddress((await params).accountAddress);
  const isOfacSanctioned = await getAccountIsOfacSanctioned(accountAddress);
  return Response.json(isOfacSanctioned);
}
