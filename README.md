# Morpho Blueprint

![Morpho Blueprint](/public/opengraph-image.png)

Morpho Blueprint is an open source [Next.js](https://nextjs.org/) whitelabeled frontend for the [Morpho protocol](https://morpho.xyz/) allowing anyone to spin up their own custom Morpho interface in hours instead of weeks/months.

## Configuration

All configuration happens via files in the [config folder](src/config/), which should be the only folder you need to touch to create a custom deployment. The config files are:

-   [index.ts](src/config/index.ts): App configuration controlling things like:
    -   Which chains your app supports
    -   Which vaults your app supports
    -   Action parameters
    -   App metadata
    -   Feature flags
    -   ...
    -   Checkout [`AppConfig` type definition](src/config/types.ts) for full parameters documentation
-   [theme.css](src/config/theme.css): Customize all colors and typography to match your brand. This closely follows the standard [shadcn themeing](https://ui.shadcn.com/themes). The best way to pick your theme is via the Morpho Blueprint Figma file (coming soon) which is a 1:1 match with the apps theme.

All read-only data in Morpho Blueprint is powered by [Whisk](https://www.whisk.so/), and enters the app via the [data layer](src/data/whisk). Using Whisk is fastest way to get to production, but you are welcome to shim this layer out with your own data source.

[Reach out](https://paperclip.xyz/contact) if you want to use Whisk, or you're interested in a full white glove solution including design, deployment, and hosting. We can generally get your app to production within 48 hours.

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

Special thanks to [Re7 Labs](https://www.re7labs.xyz/) for supporting this open source tool as part of [MIP-93](https://forum.morpho.org/t/mip-93-call-for-grants/1177/23).

## Licensing

The code is under the GNU AFFERO GENERAL PUBLIC LICENSE v3.0, see [`LICENSE`](./LICENSE).
