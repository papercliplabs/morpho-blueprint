import { getAddress } from "viem";

import { getMarketPositions } from "@/modules/market/data/getMarketPositions";

export async function GET(_request: Request, { params }: { params: Promise<{ accountAddress: string }> }) {
  const accountAddress = getAddress((await params).accountAddress);
  const marketPositions = await getMarketPositions(accountAddress);
  return Response.json(marketPositions);
}
