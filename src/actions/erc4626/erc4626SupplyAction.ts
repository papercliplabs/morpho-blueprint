import { MathLib } from "@morpho-org/blue-sdk";
import {
  type Address,
  type Chain,
  type Client,
  encodeFunctionData,
  erc20Abi,
  erc4626Abi,
  isAddressEqual,
  type Transport,
  zeroAddress,
} from "viem";
import { multicall, simulateCalls } from "viem/actions";
import { tryCatch } from "@/utils/tryCatch";
import { type TransactionRequest, UserFacingError, type VaultAction } from "../types";

interface Erc4626SupplyActionParameters {
  client: Client<Transport, Chain>;
  vaultAddress: Address;
  accountAddress: Address;
  supplyAmount: bigint;
}

export async function erc4626SupplyAction({
  client,
  vaultAddress,
  accountAddress,
  supplyAmount,
}: Erc4626SupplyActionParameters): Promise<VaultAction> {
  validateInputs(vaultAddress, accountAddress, supplyAmount);

  const { data, error } = await tryCatch(fetchData(client, vaultAddress, accountAddress));
  if (error) {
    throw new UserFacingError("Unable to load vault data.", { cause: error });
  }

  const { underlyingAssetAddress, accountUnderlyingAssetBalance, maxDeposit, allowance } = data;

  if (maxDeposit < supplyAmount) {
    throw new UserFacingError("Supply amount exceeds the max deposit allowed by the vault.");
  }
  if (accountUnderlyingAssetBalance < supplyAmount) {
    throw new UserFacingError("Supply amount exceeds the account balance.");
  }

  const requiresApproval = allowance < supplyAmount;

  const transactionRequests: TransactionRequest[] = [];

  if (requiresApproval) {
    if (allowance > 0n) {
      // Revoke approval before setting new to avoid approval frontrunning attack
      // This can only occur if the vault has code which allows for someone to execute an action on the users behalf
      // Note that USDT requires this as it will revert otherwise (frontrunning prevention built into the contract)
      transactionRequests.push({
        name: "Revoke existing approval",
        tx: () => ({
          to: underlyingAssetAddress,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: "approve",
            args: [vaultAddress, 0n],
          }),
        }),
      });
    }

    transactionRequests.push({
      name: "Approve supply amount",
      tx: () => ({
        to: underlyingAssetAddress,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [vaultAddress, supplyAmount],
        }),
      }),
    });
  }

  transactionRequests.push({
    name: "Supply to vault",
    tx: () => ({
      to: vaultAddress,
      data: encodeFunctionData({
        abi: erc4626Abi,
        functionName: "deposit",
        args: [supplyAmount, accountAddress],
      }),
    }),
  });

  const { data: assetChanges, error: simulationError } = await tryCatch(
    simulate(client, accountAddress, transactionRequests),
  );
  if (simulationError) {
    throw new UserFacingError("Simulation failure.", { cause: simulationError });
  }

  const { data: positionChange, error: verifyAssetChangesError } = await tryCatch(
    verifyAssetChanges(client, vaultAddress, underlyingAssetAddress, supplyAmount, assetChanges),
  );
  if (verifyAssetChangesError) {
    throw new UserFacingError("Asset change verification failure.", { cause: verifyAssetChangesError });
  }

  return {
    transactionRequests,
    signatureRequests: [],
    positionChange: {
      balance: {
        before: positionChange.positionBalanceBefore,
        after: positionChange.positionBalanceAfter,
      },
    },
  };
}

function validateInputs(vaultAddress: Address, accountAddress: Address, supplyAmount: bigint) {
  if (supplyAmount <= 0n) {
    throw new UserFacingError("Invalid input: Supply amount must be greater than 0.");
  }

  if (
    isAddressEqual(accountAddress, zeroAddress) ||
    isAddressEqual(vaultAddress, zeroAddress) ||
    isAddressEqual(accountAddress, vaultAddress)
  ) {
    throw new UserFacingError("Invalid input: Account and vault addresses must be distinct and non-zero.");
  }
}

async function fetchData(client: Client<Transport, Chain>, vaultAddress: Address, accountAddress: Address) {
  const [underlyingAssetAddress, maxDeposit] = await multicall(client, {
    contracts: [
      {
        abi: erc4626Abi,
        address: vaultAddress,
        functionName: "asset",
        args: [],
      },
      {
        abi: erc4626Abi,
        address: vaultAddress,
        functionName: "maxDeposit",
        args: [accountAddress],
      },
    ],
    allowFailure: false,
  });

  const [accountUnderlyingAssetBalance, allowance] = await multicall(client, {
    contracts: [
      {
        abi: erc20Abi,
        address: underlyingAssetAddress,
        functionName: "balanceOf",
        args: [accountAddress],
      },
      {
        abi: erc20Abi,
        address: underlyingAssetAddress,
        functionName: "allowance",
        args: [accountAddress, vaultAddress],
      },
    ],
    allowFailure: false,
  });

  return {
    underlyingAssetAddress,
    maxDeposit,
    accountUnderlyingAssetBalance,
    allowance,
  };
}

async function simulate(
  client: Client<Transport, Chain>,
  accountAddress: Address,
  transactionRequests: TransactionRequest[],
) {
  const { assetChanges, results } = await simulateCalls(client, {
    account: accountAddress,
    calls: transactionRequests.map((request) => {
      const tx = request.tx();
      return {
        to: tx.to,
        data: tx.data,
      };
    }),
    traceAssetChanges: true,
  });

  // Ensure all transactions succeeded
  results.forEach((result) => {
    if (result.status === "failure") {
      throw result.error;
    }
  });

  return assetChanges;
}

async function verifyAssetChanges(
  client: Client<Transport, Chain>,
  vaultAddress: Address,
  underlyingAssetAddress: Address,
  supplyAmount: bigint,
  assetChanges: Awaited<ReturnType<typeof simulate>>,
) {
  // Only expect vault asset and vault shares to change
  if (assetChanges.length !== 2) {
    throw new Error("Unexpected number of asset changes.");
  }

  const vaultShareChange = assetChanges.find((change) => isAddressEqual(change.token.address, vaultAddress));
  const underlyingAssetChange = assetChanges.find((change) =>
    isAddressEqual(change.token.address, underlyingAssetAddress),
  );

  if (!vaultShareChange || !underlyingAssetChange) {
    throw new Error("Missing expected asset changes.");
  }

  if (supplyAmount !== MathLib.abs(underlyingAssetChange.value.diff)) {
    throw new Error("Unexpected underlying asset change.");
  }

  // Convert shares to assets
  const [positionBalanceBefore, positionBalanceAfter] = await multicall(client, {
    contracts: [
      {
        abi: erc4626Abi,
        address: vaultAddress,
        functionName: "convertToAssets",
        args: [vaultShareChange.value.pre],
      },
      {
        abi: erc4626Abi,
        address: vaultAddress,
        functionName: "convertToAssets",
        args: [vaultShareChange.value.post],
      },
    ],
    allowFailure: false,
  });

  return {
    positionBalanceBefore,
    positionBalanceAfter,
  };
}
