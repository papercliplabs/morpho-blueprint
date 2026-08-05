import { beforeEach, describe, expect, it, vi } from "vitest";

// The module under test is server-only and wraps its resolver in Next/React caches. Neutralize all
// three so the whitelist logic can be driven directly.
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cache: <T>(fn: T) => fn }));
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  cache: <T>(fn: T) => fn,
}));

const executeMorphoQuery = vi.fn();
vi.mock("@/common/utils/executeMorphoQuery", () => ({
  executeMorphoQuery: (...args: unknown[]) => executeMorphoQuery(...args),
}));

// The walk is driven by the configured vaults, so pin a minimal single-chain V2-only config: the
// suite's mocked responses and call counts assume exactly one starting round on chain 1.
vi.mock("@/config", () => ({
  SUPPORTED_CHAIN_IDS: [1],
  APP_CONFIG: {
    supportedVaults: {
      1: [{ address: "0xConfigured", protocol: "MorphoV2" }],
    },
  },
}));

const marketId = (n: number) => `0x${n.toString(16).padStart(64, "0")}`;

const marketV1Cap = (n: number) => ({
  type: "MarketV1",
  data: { __typename: "MarketV1CapData", market: { marketId: marketId(n) } },
});

const vaultV2 = ({
  chainId = 1,
  caps = [] as ReturnType<typeof marketV1Cap>[],
  capsTotal,
  adapters = [] as unknown[],
  adaptersTotal,
}: {
  chainId?: number;
  caps?: ReturnType<typeof marketV1Cap>[];
  capsTotal?: number;
  adapters?: unknown[];
  adaptersTotal?: number;
}) => ({
  chain: { id: chainId },
  caps: { pageInfo: { countTotal: capsTotal ?? caps.length }, items: caps },
  adapters: { pageInfo: { countTotal: adaptersTotal ?? adapters.length }, items: adapters },
});

const metaMorphoAdapter = (...ns: number[]) => ({
  __typename: "MetaMorphoAdapter",
  metaMorpho: { state: { allocation: ns.map((n) => ({ market: { marketId: marketId(n) } })) } },
});

const vaultV2Adapter = (address: string, chainId = 1) => ({
  __typename: "MorphoVaultV2Adapter",
  innerVault: { address, chain: { id: chainId } },
});

async function loadWhitelist() {
  const { getSupportedMarketIds } = await import("@/modules/market/data/getSupportedMarketIds");
  return getSupportedMarketIds();
}

describe("getSupportedMarketIds", () => {
  beforeEach(() => {
    vi.resetModules();
    executeMorphoQuery.mockReset();
  });

  it("unions MarketV1 caps with MetaMorpho adapter allocations", async () => {
    executeMorphoQuery.mockResolvedValue({
      vaultV2s: { items: [vaultV2({ caps: [marketV1Cap(1), marketV1Cap(2)], adapters: [metaMorphoAdapter(2, 3)] })] },
    });

    expect(await loadWhitelist()).toEqual({ 1: [marketId(1), marketId(2), marketId(3)] });
  });

  it("ignores caps that are not MarketV1", async () => {
    executeMorphoQuery.mockResolvedValue({
      vaultV2s: {
        items: [
          vaultV2({
            caps: [
              marketV1Cap(1),
              { type: "Collateral", data: { __typename: "CollateralCapData" } },
              { type: "Adapter", data: { __typename: "AdapterCapData" } },
            ] as never,
          }),
        ],
      },
    });

    expect(await loadWhitelist()).toEqual({ 1: [marketId(1)] });
  });

  it("drains caps that span multiple pages", async () => {
    // 250 caps against a 100-wide page: three rounds, and the whitelist must hold all of them.
    const page = (from: number, to: number) => Array.from({ length: to - from }, (_, i) => marketV1Cap(from + i + 1));

    executeMorphoQuery
      .mockResolvedValueOnce({ vaultV2s: { items: [vaultV2({ caps: page(0, 100), capsTotal: 250 })] } })
      .mockResolvedValueOnce({ vaultV2s: { items: [vaultV2({ caps: page(100, 200), capsTotal: 250 })] } })
      .mockResolvedValueOnce({ vaultV2s: { items: [vaultV2({ caps: page(200, 250), capsTotal: 250 })] } });

    const result = await loadWhitelist();

    expect(executeMorphoQuery).toHaveBeenCalledTimes(3);
    expect(result[1]).toHaveLength(250);
    expect(new Set(result[1])).toEqual(new Set(Array.from({ length: 250 }, (_, i) => marketId(i + 1))));
  });

  it("stops after one round when nothing is truncated", async () => {
    executeMorphoQuery.mockResolvedValue({
      vaultV2s: { items: [vaultV2({ caps: [marketV1Cap(1)], adapters: [metaMorphoAdapter(2)] })] },
    });

    await loadWhitelist();

    expect(executeMorphoQuery).toHaveBeenCalledTimes(1);
  });

  it("follows a MorphoVaultV2Adapter into the inner vault's markets", async () => {
    executeMorphoQuery
      .mockResolvedValueOnce({
        vaultV2s: { items: [vaultV2({ caps: [marketV1Cap(1)], adapters: [vaultV2Adapter("0xInner")] })] },
      })
      .mockResolvedValueOnce({
        vaultV2s: { items: [vaultV2({ caps: [marketV1Cap(2)], adapters: [metaMorphoAdapter(3)] })] },
      });

    const result = await loadWhitelist();

    expect(executeMorphoQuery).toHaveBeenCalledTimes(2);
    expect(new Set(result[1])).toEqual(new Set([marketId(1), marketId(2), marketId(3)]));
  });

  it("stops walking when adapters point back at a vault already visited", async () => {
    // A cycle would otherwise recurse until the depth bound; the visited set cuts it immediately.
    executeMorphoQuery.mockResolvedValue({
      vaultV2s: { items: [vaultV2({ caps: [marketV1Cap(1)], adapters: [vaultV2Adapter("0xSelf")] })] },
    });

    const result = await loadWhitelist();

    expect(result[1]).toEqual([marketId(1)]);
    // One round for the configured vaults, one for 0xSelf; revisiting it resolves to a no-op.
    expect(executeMorphoQuery).toHaveBeenCalledTimes(2);
  });

  it("bounds the walk when vaults nest deeper than the adapter depth limit", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    let depth = 0;
    executeMorphoQuery.mockImplementation(async () => {
      depth += 1;
      return {
        vaultV2s: { items: [vaultV2({ caps: [marketV1Cap(depth)], adapters: [vaultV2Adapter(`0xInner${depth}`)] })] },
      };
    });

    const result = await loadWhitelist();

    expect(result[1]).toEqual([marketId(1), marketId(2), marketId(3)]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("nest deeper than"));
    warn.mockRestore();
  });
});
