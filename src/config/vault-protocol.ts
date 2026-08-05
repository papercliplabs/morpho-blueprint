/**
 * ERC-4626 vault protocols the app can render.
 *
 * This is the per-vault discriminator in `APP_CONFIG.supportedVaults`: it selects which Morpho
 * query serves a vault (`vaultV2s`/`vaultV2ByAddress` vs `vaults`/`vaultByAddress`) and which
 * protocol-specific page content is rendered.
 */
export const Erc4626VaultProtocol = {
  MorphoV1: "MorphoV1",
  MorphoV2: "MorphoV2",
} as const;

export type Erc4626VaultProtocol = (typeof Erc4626VaultProtocol)[keyof typeof Erc4626VaultProtocol];
