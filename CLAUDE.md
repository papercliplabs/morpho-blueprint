# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

**Development:**
- `pnpm dev` - Start development server with Next.js and GraphQL codegen watch mode
- `pnpm build` - Build for production (runs codegen first)
- `pnpm lint` - Lint src and test directories
- `pnpm test` - Run Vitest tests
- `pnpm codegen` - Generate GraphQL types from schema

**Testing:**
- Tests use Vitest with jsdom environment
- Test files are in `test/` directory with `.test.ts` extension
- Tests run sequentially (not concurrent) due to anvil fork state leakage
- 120s timeout for tests

**Package Manager:**
- Uses pnpm (required version 10.11.0)
- Dependencies include Morpho SDKs, Next.js 15, React 19, Radix UI, Tailwind CSS

## Architecture

**Configuration-Driven Approach:**
The app is designed as a whitelabel frontend where all customization happens in `src/config/`:
- `src/config/index.ts` - Main app configuration (chains, vaults, feature flags, branding)
- `src/config/theme.css` - Color and typography theming (follows shadcn patterns)
- `src/config/types.ts` - TypeScript definitions for configuration

**Data Layer:**
- Powered by Whisk GraphQL API for read-only data
- GraphQL fragments defined in `src/data/whisk/fragments.ts`
- Generated types from GraphQL schema via `@graphql-codegen/cli`
- Data fetching functions in `src/data/whisk/` directory

**Action System:**
Blockchain interactions use a standardized action pattern:
- Actions in `src/actions/` return either success (with signature/transaction requests) or error status
- Two main action types: `VaultAction` and `MarketAction` 
- Actions include position change calculations for UI updates
- Uses Morpho's bundler SDK for transaction bundling

**Component Structure:**
- UI components in `src/components/ui/` (shadcn-based)
- Business logic components organized by domain (`market/`, `vault/`, `tables/`)
- Form components use react-hook-form with Zod validation
- Responsive design with mobile-first approach using drawer/popover patterns

**State Management:**
- React Query for server state and caching
- React Hook Form for form state
- Context providers for wallet connection (wagmi) and theming

**Supported Chains:**
- Mainnet, Base, Polygon, Worldchain
- Chain configuration includes RPC URLs and supported vaults per chain
- Type-safe chain IDs via `SUPPORTED_CHAIN_IDS` constant

**Feature Flags:**
Configurable features in `APP_CONFIG.featureFlags`:
- `curatorColumn` - Show curator info in tables
- `darkModeToggle` - Enable dark mode switching
- `showUnsupportedVaults` - Display unsupported vaults in allocation tablets
