"use client";
import { useModal } from "connectkit";
import { useAccount } from "wagmi";
import { Button } from "@/common/components/ui/button";
import { formatAddress } from "@/common/utils/format";

export function ConnectButton() {
  const { setOpen: setConnectKitOpen } = useModal();
  const { address } = useAccount();

  return (
    <Button onClick={() => setConnectKitOpen(true)} variant={address ? "secondary" : "default"} size="sm">
      {address ? formatAddress(address) : "Connect"}
    </Button>
  );
}
