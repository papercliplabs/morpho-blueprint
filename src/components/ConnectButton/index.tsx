"use client";
import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";

import { formatAddress } from "@/utils/format";

import { Button } from "../ui/button";

export function ConnectButton() {
  const { open } = useAppKit();
  const { address } = useAccount();

  return (
    <Button onClick={() => open()} variant={address ? "secondary" : "default"}>
      {address ? formatAddress(address) : "Connect"}
    </Button>
  );
}
