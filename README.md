# Morpho Blueprint

![Morpho Blueprint](/public/opengraph-image.png)

Morpho Blueprint is an open-source [Next.js](https://nextjs.org/) white-label frontend template for the [Morpho protocol](https://morpho.xyz/) built and maintained by [Paperclip Labs](https://paperclip.xyz/). It enables anyone to deploy their own custom Morpho interface in hours instead of weeks or months.

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

All read-only data in Morpho Blueprint is powered by [Whisk](https://www.whisk.so/). Using Whisk is the fastest way to get to production, but you are welcome to replace Whisk with your own data source.

[Reach out](https://paperclip.xyz/contact) if you want to use Whisk, or you're interested in a full white-glove solution including design and development. We can generally get your app to production in a few days.

> If the provided customization parameters are insufficient for your use case, you can modify code outside the `/config` folder, but this will be harder to pick up additional future features and patches from this canonical template repo.

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
