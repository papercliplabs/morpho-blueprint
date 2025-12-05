import { Card, CardHeader } from "@/components/ui/card";
import { Markdown } from "@/components/ui/markdown";
import type { Vault } from "@/data/whisk/getVault";

interface VaultAboutCardProps {
  vaultPromise: Promise<Vault>;
}

export async function VaultAboutCard({ vaultPromise }: VaultAboutCardProps) {
  const vault = await vaultPromise;

  if (!vault || !("metadata" in vault) || !vault.metadata?.description) {
    return null;
  }

  return (
    <Card>
      <CardHeader>About</CardHeader>
      <div className="body-large">
        <Markdown>{vault.metadata.description}</Markdown>
      </div>
    </Card>
  );
}
