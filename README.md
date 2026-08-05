# Morpho Blueprint

![Morpho Blueprint](/public/opengraph-image.png)

Morpho Blueprint is an open-source [Next.js](https://nextjs.org/) white-label frontend template for the [Morpho protocol](https://morpho.org/), originally built by [Paperclip Labs](https://paperclip.xyz/) and maintained as the reference implementation of a Blueprint app on the public [Morpho API](https://docs.morpho.org/tools/offchain/api/). It enables anyone to deploy their own custom Morpho interface in hours instead of weeks or months.

## Quickstart

The app reads all protocol data from the public, keyless Morpho GraphQL API, so no data credential is needed:

```bash
pnpm i
cp .env.example .env   # populate RPC URLs and a Reown project id
pnpm dev
```

## Configuration

All configuration happens via files in the [config folder](src/config/), which should be the only folder you need to touch to create a custom deployment. The config files are:

-   [index.ts](src/config/index.ts): App configuration controlling things like:
    -   Which chains your app supports
    -   Which vaults your app supports
    -   Action parameters
    -   App metadata
    -   Feature flags
    -   ...
    -   Check out the [`AppConfig` type definition](src/config/types.ts) for full parameter documentation
-   [theme.css](src/config/theme.css): Customize all colors and typography to match your brand. This closely follows the standard [shadcn theming](https://ui.shadcn.com/themes).

> If the provided customization parameters are insufficient for your use case, you can modify code outside the `/config` folder, but this will be harder to pick up additional future features and patches from this canonical template repo.

## Data

All read-only data comes from the [Morpho GraphQL API](https://api.morpho.org/graphql), read through a single server-only chokepoint ([executeMorphoQuery](src/common/utils/executeMorphoQuery.ts)). The browser only ever talks to the app's own `/api/*` routes.

The public endpoint is keyless, so the app runs as-is with no data credential. To point a deployment at a dedicated API instance, set `MORPHO_API_URL` and `MORPHO_API_KEY` (sent as an `x-api-key` header).

GraphQL types are generated from a committed schema snapshot in [`schema/`](schema/), so builds never depend on a live upstream. See [`schema/README.md`](schema/README.md) for how to refresh it.

Two things the API does not serve are sourced elsewhere:

-   Wallet ERC-20 balances are joined in server-side with a multicall `balanceOf` against the configured RPC URLs.
-   Chain icons come from the Morpho CDN (`https://cdn.morpho.org/assets/chains/<slug>.svg`), configured per chain via `iconSlug` in the chain config; a chain without a slug renders without an icon.

Every chain in `SUPPORTED_CHAIN_IDS` must be indexed by the configured API instance — the public endpoint rejects queries for chains it does not serve. You can check the served set with `{ chains { id network } }` against the endpoint.

## Environment

See [.env.example](.env.example) for the full list. Notes:

-   `MORPHO_API_URL` / `MORPHO_API_KEY` are optional; without them the app uses the public keyless endpoint.
-   A mainnet RPC URL (`MAINNET_RPC_URL_1`, optionally `MAINNET_RPC_URL_2`) is **required for all deployments, even ones that don't serve mainnet vaults or markets**: the OFAC sanctions screening reads Chainalysis's on-chain oracle on mainnet and fails closed, so without a mainnet RPC every transaction flow is blocked.
-   Each supported chain needs its RPC URLs (`<CHAIN>_RPC_URL_1`, optionally `<CHAIN>_RPC_URL_2`).

## Local Development

Install Dependencies

```bash
pnpm i
```

Create and populate environment variables

```bash
cp .env.example .env
# Now populate the .env file
```

Start the development server

```bash
pnpm dev
```

Run tests

```bash
pnpm test
```

Build

```bash
pnpm build
```

## Acknowledgement

This open-source project was created by [Paperclip Labs](https://paperclip.xyz/) and made possible through the support of [Morpho](https://morpho.org/) and [Steakhouse Financial](https://www.steakhouse.financial/).

Initial development was partially funded through a Morpho DAO grant ([MIP-93](https://forum.morpho.org/t/mip-93-call-for-grants/1177/23)), administered by [Re7 Labs](https://www.re7labs.xyz/).

## Licensing

The code is under the MIT License, see [`LICENSE`](./LICENSE).
