import { blo } from "blo";
import { formatAddress, getKnownAddressMeta } from "./format";

export function getAvatarForAddress(address: `0x${string}`) {
  const meta = getKnownAddressMeta(address);

  return {
    src: meta?.iconUrl || blo(address),
    alt: meta?.name || formatAddress(address),
  };
}
