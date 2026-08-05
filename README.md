# Morpho Blueprint

> [!IMPORTANT]
> **This repository is no longer maintained.** Development has moved to [morpho-org/morpho-blueprint](https://github.com/morpho-org/morpho-blueprint), maintained by [Morpho](https://morpho.org/), which replaces Whisk with the Morpho API. Start new deployments there, and file issues and pull requests there. This repo remains available for reference only.

![Morpho Blueprint](/public/opengraph-image.png)

Morpho Blueprint is an open-source [Next.js](https://nextjs.org/) white-label frontend template for the [Morpho protocol](https://morpho.xyz/), originally built by [Paperclip Labs](https://paperclip.xyz/). It enables anyone to deploy their own custom Morpho interface in hours instead of weeks or months.

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
-   [theme.css](src/config/theme.css): Customize all colors and typography to match your brand. This closely follows the standard [shadcn theming](https://ui.shadcn.com/themes). The best way to pick your theme is via the Morpho Blueprint Figma file (coming soon) which is a 1:1 match with the app's theme.

All read-only data in this version of Morpho Blueprint is powered by [Whisk](https://www.whisk.so/). The maintained fork uses the [Morpho API](https://docs.morpho.org/) instead.

> If the provided customization parameters are insufficient for your use case, you can modify code outside the `/config` folder, but this will be harder to pick up future features and patches from the maintained fork.

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

This open-source project is made possible through the support of [Morpho](https://morpho.org/) and [Steakhouse Financial](https://www.steakhouse.financial/).

Initial development was partially funded through a Morpho DAO grant ([MIP-93](https://forum.morpho.org/t/mip-93-call-for-grants/1177/23)), administered by [Re7 Labs](https://www.re7labs.xyz/).

## Licensing

The code is under the MIT License, see [`LICENSE`](./LICENSE).
