import { getWalletIsSanctioned } from "@/modules/compliance/data/getWalletIsSanctioned";

export async function GET(_request: Request, { params }: { params: Promise<{ accountAddress: string }> }) {
  const { accountAddress } = await params;
  // Malformed addresses are screened as sanctioned rather than surfaced as an error, see getWalletIsSanctioned.
  const isOfacSanctioned = await getWalletIsSanctioned(accountAddress);
  return Response.json(isOfacSanctioned);
}
