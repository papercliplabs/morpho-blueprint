/**
 * Page sizes for the nested collections a vault V2 exposes. Whisk returned these inline and
 * unpaginated; Morpho paginates them, so the app owns the policy. This is vault-V2 protocol sizing,
 * so it lives with the vault module rather than in the protocol-agnostic `common/data` pagination
 * helpers.
 *
 * Both cover every vault seen in production (23 caps and 1 adapter at the widest) with room to
 * spare. `getVaultMarketIds` drains past them with `skip`; every other read takes a single page and
 * reports truncation through `warnIfTruncated` rather than silently dropping rows.
 *
 * These are the single source of truth: the fragments that select these collections take the page
 * size as a GraphQL variable (`$capsFirst` / `$adaptersFirst`), which the data functions fill in
 * from here.
 */
export const CAPS_PAGE_SIZE = 100;
export const ADAPTERS_PAGE_SIZE = 50;

/**
 * The summaries query fans this out across every configured vault, and the API multiplies a
 * paginated field's cost by `first` at each nesting level — so unlike the single-vault detail read,
 * this one's cost scales with the vault count. At 50 the 1,000,000 complexity cap is reached around
 * 65 configured vaults; at 20 it is around 160. Truncation past this is reported by
 * `warnIfTruncated`, so an over-wide vault logs instead of silently dropping exposure rows.
 */
export const SUMMARY_ADAPTERS_PAGE_SIZE = 20;

/**
 * A MarketV1 adapter's `positions` list has one entry per market the adapter supplies, so it is
 * bounded by the vault's cap count (23 at the widest in production). The API multiplies query cost
 * by `first` at each nesting level and `positions` defaults to 100, so an explicit page keeps the
 * `adapters × positions` product inside the 1,000,000 complexity cap; `warnIfTruncated` reports
 * anything past it.
 */
export const POSITIONS_PAGE_SIZE = 30;

/**
 * The market page fans `adapters × positions` out over every supplying vault V2, so it uses a
 * narrower adapter page than the single-vault detail read (production vaults have 1 adapter at the
 * widest). At 50 × 100 the measured cost was ~160k per supplying vault — three vaults already sat
 * at half the complexity cap; 10 × 30 keeps a market with dozens of supplying vaults well inside.
 */
export const SUPPLIER_ADAPTERS_PAGE_SIZE = 10;
