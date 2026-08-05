/**
 * The API caps `first` at 1000 and multiplies a paginated field's query-complexity cost by it, so
 * every list query sizes its page to what it actually asks for rather than using a fixed maximum.
 */
export const MAX_PAGE_SIZE = 1000;

export function pageSize(requested: number, label: string): number {
  if (requested > MAX_PAGE_SIZE) {
    console.warn(`${requested} ${label} requested, but the API caps a page at ${MAX_PAGE_SIZE}; the rest are dropped.`);
  }
  // The API rejects `first: 0`, so a zero request is clamped to 1. That clamp is NOT a way to say
  // "match nothing": an empty `address_in` is treated by the API as *no filter*, so a query built
  // from an empty list returns an arbitrary vault. Callers must skip the field entirely in that
  // case — via `@include(if:)` or by not issuing the sub-query — rather than relying on this.
  return Math.min(Math.max(requested, 1), MAX_PAGE_SIZE);
}

/**
 * A paginated field returns `count` (this page) and `countTotal` (the whole set). Anything the page
 * did not reach is invisible downstream — a missing allocation row rather than an error — so every
 * single-page read routes its `pageInfo` through here.
 */
export function warnIfTruncated(label: string, pageInfo: { count: number; countTotal: number } | null | undefined) {
  if (pageInfo && pageInfo.countTotal > pageInfo.count) {
    console.warn(`More ${label} available (${pageInfo.countTotal}), but only ${pageInfo.count} fetched.`);
  }
}
