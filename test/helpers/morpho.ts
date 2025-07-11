import { getChainAddresses, type MarketId } from "@morpho-org/blue-sdk";
import { blueAbi, fetchMarket, fetchVault, fetchVaultConfig, metaMorphoAbi } from "@morpho-org/blue-sdk-viem";
import type { AnvilTestClient } from "@morpho-org/test";
import { type Address, erc20Abi, type Hex } from "viem";
import { writeContract } from "viem/actions";

import { getSimulationState } from "@/actions/data/rpc/getSimulationState";

import { RANDOM_ADDRESS } from "./constants";
import { getErc20BalanceOf } from "./erc20";

const { morpho } = getChainAddresses(1);

export async function getMorphoVaultPosition(
  client: AnvilTestClient,
  vaultAddress: Address,
  accountAddress: Address = client.account.address,
) {
  const vault = await fetchVault(vaultAddress, client);

  const userShareBalance = await getErc20BalanceOf(client, vaultAddress, accountAddress);
  const userAssetBalance = vault.toAssets(userShareBalance);
  return userAssetBalance;
}

export async function getMorphoMarketPosition(
  client: AnvilTestClient,
  marketId: Hex,
  accountAddress: Address = client.account.address,
) {
  const simulationState = await getSimulationState({
    publicClient: client,
    actionType: "market",
    accountAddress: accountAddress,
    marketId: marketId as MarketId,
    requiresPublicReallocation: false,
  });

  const accrualPosition = simulationState.getAccrualPosition(accountAddress, marketId as MarketId);
  return { collateralBalance: accrualPosition.collateral, loanBalance: accrualPosition.borrowAssets };
}

export async function createVaultPosition(
  client: AnvilTestClient,
  vaultAddress: Address,
  supplyAmount: bigint,
  account: Address = client.account.address,
) {
  const vaultConfig = await fetchVaultConfig(vaultAddress, client);
  await client.deal({
    erc20: vaultConfig.asset,
    amount: supplyAmount,
    account,
  });

  await writeContract(client, {
    address: vaultConfig.asset,
    abi: erc20Abi,
    functionName: "approve",
    args: [vaultAddress, supplyAmount],
    account,
  });

  await writeContract(client, {
    address: vaultAddress,
    abi: metaMorphoAbi,
    functionName: "deposit",
    args: [supplyAmount, account],
    account,
  });
}

// Seeds the market with loan assets, using RANDOM_ADDRESS to avoid messing with client's balances
export async function seedMarketLiquidity(
  client: AnvilTestClient,
  marketId: Hex,
  supplyAmount: bigint,
  onBehalf: Address = RANDOM_ADDRESS,
) {
  const supplyAmountInternal = supplyAmount + 1n; // Extra to make 0 supply work
  const market = await fetchMarket(marketId as MarketId, client);
  const { loanToken: loanAssetAddress } = market.params;

  await client.deal({ erc20: loanAssetAddress, amount: supplyAmountInternal, account: RANDOM_ADDRESS });

  await writeContract(client, {
    address: loanAssetAddress,
    abi: erc20Abi,
    functionName: "approve",
    args: [morpho, supplyAmountInternal],
    account: RANDOM_ADDRESS,
  });

  // Supply on behalf
  await writeContract(client, {
    address: morpho,
    abi: blueAbi,
    functionName: "supply",
    args: [
      {
        loanToken: market.params.loanToken,
        collateralToken: market.params.collateralToken,
        oracle: market.params.oracle,
        irm: market.params.irm,
        lltv: market.params.lltv,
      },
      supplyAmountInternal,
      BigInt(0),
      onBehalf,
      "0x",
    ],
    account: RANDOM_ADDRESS,
  });
}

export async function createMarketPosition(
  client: AnvilTestClient,
  marketId: Hex,
  supplyCollateralAmount: bigint,
  borrowAmount: bigint,
  account: Address = client.account.address,
) {
  const market = await fetchMarket(marketId as MarketId, client);
  const { collateralToken: collateralAssetAddress } = market.params;
  await client.deal({ erc20: collateralAssetAddress, amount: supplyCollateralAmount, account });

  await writeContract(client, {
    address: collateralAssetAddress,
    abi: erc20Abi,
    functionName: "approve",
    args: [morpho, supplyCollateralAmount],
    account,
  });

  // Supply on behalf of
  await writeContract(client, {
    address: morpho,
    abi: blueAbi,
    functionName: "supplyCollateral",
    args: [
      {
        loanToken: market.params.loanToken,
        collateralToken: market.params.collateralToken,
        oracle: market.params.oracle,
        irm: market.params.irm,
        lltv: market.params.lltv,
      },
      supplyCollateralAmount,
      account,
      "0x",
    ],
    account,
  });

  if (borrowAmount > 0) {
    await writeContract(client, {
      address: morpho,
      abi: blueAbi,
      functionName: "borrow",
      args: [
        {
          loanToken: market.params.loanToken,
          collateralToken: market.params.collateralToken,
          oracle: market.params.oracle,
          irm: market.params.irm,
          lltv: market.params.lltv,
        },
        borrowAmount,
        0n,
        account,
        account,
      ],
      account,
    });
  }
}
