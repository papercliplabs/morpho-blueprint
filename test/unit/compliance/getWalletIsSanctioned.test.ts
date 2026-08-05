// @vitest-environment node
// The module under test is server-only, so there is nothing to gain from the suite's default jsdom
// environment. Under Node 24 jsdom actively breaks it: jsdom replaces the global AbortSignal, and
// undici's fetch rejects the foreign instance viem's HTTP transport passes as its timeout signal.

import { afterEach, describe, expect, vi } from "vitest";

import { getWalletIsSanctioned } from "@/modules/compliance/data/getWalletIsSanctioned";
import { test } from "../../config";

// The module under test imports "server-only", which throws outside a server bundle.
vi.mock("server-only", () => ({}));

// Sanctioned at the fork block and still sanctioned today: an OFAC designated Lazarus Group address.
const SANCTIONED_ADDRESS = "0x7F367cC41522cE07553e823bf3be79A889DEbe1B";
const CLEAN_ADDRESS = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

// An address the RPC will never be asked about, since the read fails before it is sent.
const UNREACHABLE_RPC_URL = "http://127.0.0.1:1";

describe("getWalletIsSanctioned", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("blocks an address flagged by the sanctions oracle", async ({ client }) => {
    vi.stubEnv("MAINNET_RPC_URL_1", client.transport.url);
    vi.stubEnv("MAINNET_RPC_URL_2", "");

    await expect(getWalletIsSanctioned(SANCTIONED_ADDRESS)).resolves.toBe(true);
  });

  test("allows an address the sanctions oracle does not flag", async ({ client }) => {
    vi.stubEnv("MAINNET_RPC_URL_1", client.transport.url);
    vi.stubEnv("MAINNET_RPC_URL_2", "");

    await expect(getWalletIsSanctioned(CLEAN_ADDRESS)).resolves.toBe(false);
  });

  test("falls back to the second RPC URL when the first is unreachable", async ({ client }) => {
    vi.stubEnv("MAINNET_RPC_URL_1", UNREACHABLE_RPC_URL);
    vi.stubEnv("MAINNET_RPC_URL_2", client.transport.url);

    await expect(getWalletIsSanctioned(SANCTIONED_ADDRESS)).resolves.toBe(true);
    await expect(getWalletIsSanctioned(CLEAN_ADDRESS)).resolves.toBe(false);
  });

  test("fails closed when every RPC URL is unreachable", async () => {
    vi.stubEnv("MAINNET_RPC_URL_1", UNREACHABLE_RPC_URL);
    vi.stubEnv("MAINNET_RPC_URL_2", UNREACHABLE_RPC_URL);

    await expect(getWalletIsSanctioned(CLEAN_ADDRESS)).resolves.toBe(true);
  });

  test("fails closed when the only configured RPC URL is unreachable", async () => {
    vi.stubEnv("MAINNET_RPC_URL_1", UNREACHABLE_RPC_URL);
    vi.stubEnv("MAINNET_RPC_URL_2", "");

    // Exercises the retry the transport adds when there is no second provider to fall back to.
    await expect(getWalletIsSanctioned(CLEAN_ADDRESS)).resolves.toBe(true);
  });

  test("fails closed when no RPC URL is configured", async () => {
    vi.stubEnv("MAINNET_RPC_URL_1", "");
    vi.stubEnv("MAINNET_RPC_URL_2", "");

    await expect(getWalletIsSanctioned(CLEAN_ADDRESS)).resolves.toBe(true);
  });

  test("fails closed on a malformed address", async ({ client }) => {
    vi.stubEnv("MAINNET_RPC_URL_1", client.transport.url);
    vi.stubEnv("MAINNET_RPC_URL_2", "");

    await expect(getWalletIsSanctioned("not-an-address")).resolves.toBe(true);
  });

  test("normalizes casing instead of failing closed on it", async ({ client }) => {
    vi.stubEnv("MAINNET_RPC_URL_1", client.transport.url);
    vi.stubEnv("MAINNET_RPC_URL_2", "");

    // viem's getAddress re-checksums case-mangled input rather than throwing, so a clean address
    // in the wrong case is screened normally — not blocked as malformed.
    await expect(getWalletIsSanctioned(CLEAN_ADDRESS.toLowerCase())).resolves.toBe(false);
  });
});
