import type { MerklAccountReward } from "@/data/whisk/getAccountRewards";
import { TokenIcon } from "../TokenIcon";
import NumberFlow from "../ui/number-flow";

export function RewardTokenRow({
  reward,
  includeClaimCopy,
}: {
  reward: MerklAccountReward;
  includeClaimCopy?: boolean;
}) {
  const {
    token,
    claimableAmount: { formatted, usd },
  } = reward;
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-muted/40 px-4 py-2">
      <TokenIcon token={token} chain={token.chain} size="md" showChain />
      <div className="flex flex-col text-sm">
        <span className="font-medium text-content-primary">
          {includeClaimCopy ? "Claim " : ""}
          {token.symbol}
        </span>
      </div>
      <div className="ml-auto flex flex-col items-end text-right">
        <NumberFlow value={Number(formatted)} className="body-medium-plus" />
        <NumberFlow
          value={usd ?? undefined}
          format={{ currency: "USD" }}
          className="body-small text-muted-foreground"
        />
      </div>
    </li>
  );
}
