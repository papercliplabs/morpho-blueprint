import { describe, expect, test } from "vitest";
import { mainnet } from "viem/chains";
import { parseRouteChainIdParam } from "@/common/utils/parseRouteChainId";

describe("parseRouteChainIdParam", () => {
  test("accepts a configured chain id as string", () => {
    expect(parseRouteChainIdParam(String(mainnet.id))).toBe(mainnet.id);
  });

  test("rejects nan from garbage input", () => {
    expect(parseRouteChainIdParam("not-a-number")).toBeUndefined();
  });

  test("rejects scientific notation and partial parses", () => {
    expect(parseRouteChainIdParam("1e2")).toBeUndefined();
    expect(parseRouteChainIdParam("42abc")).toBeUndefined();
  });

  test("rejects unsupported numeric chain", () => {
    expect(parseRouteChainIdParam("999999999")).toBeUndefined();
  });

  test("rejects empty and nullish", () => {
    expect(parseRouteChainIdParam("")).toBeUndefined();
    expect(parseRouteChainIdParam(undefined)).toBeUndefined();
    expect(parseRouteChainIdParam(null)).toBeUndefined();
  });
});
