import NumberFlow from "@/common/components/ui/number-flow";
import type { MerklAccountReward } from "@/modules/reward/data/getAccountRewards";
import { TokenIcon } from "@/modules/token/components/TokenIcon";

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
    <li className="flex items-center gap-3 px-4 py-2">
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
