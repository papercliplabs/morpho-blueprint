/** The concrete `VaultV2Adapter` implementations the API can return. */
export type VaultV2AdapterTypename = "MetaMorphoAdapter" | "MorphoMarketV1Adapter" | "MorphoVaultV2Adapter";

interface VaultV2AdapterHandlers<A extends { __typename: VaultV2AdapterTypename }, R> {
  /** Wraps a vault V1, whose own allocations are the adapter's markets. */
  metaMorpho: (adapter: Extract<A, { __typename: "MetaMorphoAdapter" }>) => R;
  /** Wraps markets directly; the vault carries one `MarketV1` cap per market. */
  marketV1: (adapter: Extract<A, { __typename: "MorphoMarketV1Adapter" }>) => R;
  /** Wraps another vault V2. */
  vaultV2: (adapter: Extract<A, { __typename: "MorphoVaultV2Adapter" }>) => R;
  /**
   * An implementation the API has shipped since this build. `__typename` is server-controlled, so
   * this is reachable without a deploy and every caller must say how it degrades.
   */
  unknown: (typename: string) => R;
}

/**
 * The single place that discriminates a vault V2 adapter by kind. Every read that walks the adapter
 * list routes through here — the allocation join for the breakdown tables and the supported-market
 * walk — so a new adapter implementation is a compile error in this one switch (and in the handler
 * set every caller must supply) rather than a row silently ignored by one of them.
 */
export function matchVaultV2Adapter<A extends { __typename: VaultV2AdapterTypename }, R>(
  adapter: A,
  handlers: VaultV2AdapterHandlers<A, R>,
): R {
  switch (adapter.__typename) {
    case "MetaMorphoAdapter":
      return handlers.metaMorpho(adapter as Extract<A, { __typename: "MetaMorphoAdapter" }>);
    case "MorphoMarketV1Adapter":
      return handlers.marketV1(adapter as Extract<A, { __typename: "MorphoMarketV1Adapter" }>);
    case "MorphoVaultV2Adapter":
      return handlers.vaultV2(adapter as Extract<A, { __typename: "MorphoVaultV2Adapter" }>);
    default: {
      // The `never` binding keeps a newly *known* implementation a compile error here, which is the
      // point of routing every read through this switch. It must not throw at runtime though: the
      // API can serve a fourth `__typename` at any time, and these callers are the vault detail
      // page, the earn-list collateral tooltip and the app-wide market whitelist — all of which
      // skipped an unrecognised adapter before this indirection existed. Failing the whole render
      // on a forward-compatible API change would be a strictly worse trade.
      const unhandled: never = adapter.__typename;
      console.warn(`Unknown vault V2 adapter, degrading: ${String(unhandled)}`);
      return handlers.unknown(String(unhandled));
    }
  }
}
