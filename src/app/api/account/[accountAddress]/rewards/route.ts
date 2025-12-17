import { getAddress } from "viem";

import { getAccountRewards } from "@/modules/reward/data/getAccountRewards";

export async function GET(_request: Request, { params }: { params: Promise<{ accountAddress: string }> }) {
  const accountAddress = getAddress((await params).accountAddress);
  const rewards = await getAccountRewards(accountAddress);
  return Response.json(rewards);
}
