import { describe, expect, test } from "vitest";

describe("smoke", () => {
  test("rpc url is defined", async () => {
    const rpc = process.env.MAINNET_RPC_URL_1;
    expect(rpc).toBeDefined();
  });
});
