"use client";
import { useModal } from "connectkit";
import { useAccount } from "wagmi";

import { formatAddress } from "@/utils/format";

import { Button } from "../ui/button";

export function ConnectButton() {
  const { setOpen: setConnectKitOpen } = useModal();
  const { address } = useAccount();

  return (
    <Button onClick={() => setConnectKitOpen(true)} variant={address ? "secondary" : "default"}>
      {address ? formatAddress(address) : "Connect"}
    </Button>
  );
}
