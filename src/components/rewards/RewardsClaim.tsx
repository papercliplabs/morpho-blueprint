import type { Action } from "@/actions";
import type { MerklAccountReward } from "@/data/whisk/getAccountRewards";
import { ActionFlow } from "../ActionFlow";
import { RewardTokenRow } from "./RewardTokenRow";

interface RewardsClaimProps {
  action?: Action;
  rewards?: MerklAccountReward[];
  clearAction: () => void;
}

export function RewardsClaim({ action, rewards, clearAction }: RewardsClaimProps) {
  return (
    <ActionFlow
      trackingPayload={{ tag: "rewards-claim" }}
      action={action ?? null}
      summary={action && <RewardsClaimSummary rewards={rewards ?? []} />}
      metrics={null}
      actionName={"Claim rewards"}
      open={action != null}
      onOpenChange={(open) => !open && clearAction()}
      flowCompletionCb={() => clearAction()}
    />
  );
}

function RewardsClaimSummary({ rewards }: { rewards: MerklAccountReward[] }) {
  return (
    <div className="rounded-lg bg-muted">
      {rewards.map((reward) => (
        <RewardTokenRow key={reward.token.address} reward={reward} includeClaimCopy />
      ))}
    </div>
  );
}
