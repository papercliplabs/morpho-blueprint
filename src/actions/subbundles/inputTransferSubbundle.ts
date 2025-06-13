import { ChainId, NATIVE_ADDRESS, getChainAddresses } from "@morpho-org/blue-sdk";
import { BundlerAction } from "@morpho-org/bundler-sdk-viem";
import { MaybeDraft, SimulationState } from "@morpho-org/simulation-sdk";
import { Address, encodeFunctionData, erc20Abi, isAddressEqual, maxUint256, parseEther } from "viem";

import { Subbundle } from "../types";
import { bigIntMax, bigIntMin } from "../utils/bigint";
import { computeAmountWithRebasingMargin } from "../utils/math";

// If a user requests max action and wrapping of native asset, leave this much native in their wallet for future gas.
export const MIN_REMAINING_NATIVE_ASSET_BALANCE_AFTER_WRAPPING = parseEther("0.1");

interface InputTransferSubbundleParameters {
  chainId: ChainId;
  accountAddress: Address;
  tokenAddress: Address;
  amount: bigint; // Max uint256 for entire account balanace
  recipientAddress: Address;
  config: {
    accountSupportsSignatures: boolean;
    tokenIsRebasing: boolean;
    allowWrappingNativeAssets: boolean;
  };
  simulationState: MaybeDraft<SimulationState>;
}

// Input transfer subbundle that supports ERC-20, and also native assets when the ERC-20 is the wrapped native asset
export function inputTransferSubbundle({
  chainId,
  accountAddress,
  tokenAddress,
  amount,
  recipientAddress,
  config: { tokenIsRebasing, allowWrappingNativeAssets },
  simulationState,
}: InputTransferSubbundleParameters): Subbundle {
  const {
    wNative: wrappedNativeAddress,
    bundler3: { generalAdapter1: generalAdapter1Address },
  } = getChainAddresses(chainId);

  const supportedAdapters = [generalAdapter1Address];

  if (!wrappedNativeAddress) {
    throw new Error("Wrapped native address not found");
  }

  const isMaxTransfer = amount == maxUint256;
  const isWrappedNative = isAddressEqual(tokenAddress, wrappedNativeAddress);

  const accountErc20Holding = simulationState.getHolding(accountAddress, tokenAddress);
  const accountErc20Balance = accountErc20Holding.balance;

  const accountNativeHolding = simulationState.getHolding(accountAddress, NATIVE_ADDRESS);
  const accountNativeBalance = accountNativeHolding.balance;

  let nativeAmountToWrap = 0n;
  const erc20Amount = bigIntMin(amount, accountErc20Balance);
  const usableNativeBalance = bigIntMax(accountNativeBalance - MIN_REMAINING_NATIVE_ASSET_BALANCE_AFTER_WRAPPING, 0n);
  if (isWrappedNative && allowWrappingNativeAssets) {
    nativeAmountToWrap = isMaxTransfer ? usableNativeBalance : bigIntMin(amount - erc20Amount, usableNativeBalance); // Guaranteed to be >= 0
  }

  if (!isMaxTransfer && erc20Amount + nativeAmountToWrap < amount) {
    throw Error("Insufficient wallet balance.");
  }

  // Ignore tokenIsRebasing for wrapped native since it's not
  const requiredApprovalAmount =
    isMaxTransfer && tokenIsRebasing && !isWrappedNative ? computeAmountWithRebasingMargin(erc20Amount) : erc20Amount;

  // Mofify the simulation state accordingly
  accountErc20Holding.balance -= erc20Amount;
  accountNativeHolding.balance -= nativeAmountToWrap;

  if (supportedAdapters.includes(recipientAddress)) {
    const recipientTokenHolding = simulationState.getHolding(recipientAddress, tokenAddress);
    recipientTokenHolding.balance += erc20Amount + nativeAmountToWrap;
  }

  // TODO: add support with signatures also, switching based on accountSupportsSignatures
  const inputErc20TransferSubbundle = prepareInputErc20TransferSubbundleWithoutSignatures({
    chainId,
    accountAddress,
    tokenAddress,
    amount: erc20Amount == 0n ? 0n : isMaxTransfer ? maxUint256 : erc20Amount, // Use maxUint256 for rebasing tokens
    recipientAddress,
    requiredApprovalAmount,
    simulationState,
  });

  const sendAndWrapNativeSubbundle = prepareSendAndWrapNativeSubbundle({
    chainId,
    accountAddress,
    amount: nativeAmountToWrap,
    recipientAddress,
  });

  return {
    signatureRequirements: [
      ...inputErc20TransferSubbundle.signatureRequirements,
      ...sendAndWrapNativeSubbundle.signatureRequirements,
    ],
    transactionRequirements: [
      ...inputErc20TransferSubbundle.transactionRequirements,
      ...sendAndWrapNativeSubbundle.transactionRequirements,
    ],
    bundlerCalls: () => [...inputErc20TransferSubbundle.bundlerCalls(), ...sendAndWrapNativeSubbundle.bundlerCalls()],
  };
}

interface PrepareInputErc20TransferSubbundleParameters {
  chainId: ChainId;
  accountAddress: Address;
  tokenAddress: Address;
  amount: bigint; // Max uint256 for entire account balanace
  recipientAddress: Address;
  requiredApprovalAmount: bigint;
  simulationState: MaybeDraft<SimulationState>;
}

function prepareInputErc20TransferSubbundleWithoutSignatures({
  chainId,
  accountAddress,
  tokenAddress,
  amount,
  recipientAddress,
  requiredApprovalAmount,
  simulationState,
}: PrepareInputErc20TransferSubbundleParameters): Subbundle {
  // Nothing to do
  if (amount == 0n) {
    return {
      signatureRequirements: [],
      transactionRequirements: [],
      bundlerCalls: () => [],
    };
  }

  const {
    bundler3: { generalAdapter1: generalAdapter1Address },
  } = getChainAddresses(chainId);

  const token = simulationState.getToken(tokenAddress);

  const accountErc20Holding = simulationState.getHolding(accountAddress, tokenAddress);
  const currentAllowance = accountErc20Holding.erc20Allowances["bundler3.generalAdapter1"];
  const requiresApproval = currentAllowance < requiredApprovalAmount;

  return {
    signatureRequirements: [],
    transactionRequirements: [
      ...(requiresApproval
        ? [
            {
              name: `Approve ${token.symbol ?? "Token"}`,
              tx: () => ({
                to: tokenAddress,
                data: encodeFunctionData({
                  abi: erc20Abi,
                  functionName: "approve",
                  args: [generalAdapter1Address, requiredApprovalAmount],
                }),
                value: BigInt(0),
              }),
            },
          ]
        : []),
    ],
    bundlerCalls: () => BundlerAction.erc20TransferFrom(chainId, tokenAddress, amount, recipientAddress),
  };
}

interface PrepareSendAndWrapNativeSubbundleParameters {
  chainId: ChainId;
  accountAddress: Address;
  amount: bigint; // Max uint256 for entire account balance, note it will keep a small amount leftover for gas
  recipientAddress: Address;
}

export function prepareSendAndWrapNativeSubbundle({
  chainId,
  accountAddress,
  amount,
  recipientAddress,
}: PrepareSendAndWrapNativeSubbundleParameters): Subbundle {
  // Nothing to do
  if (amount == 0n) {
    return {
      signatureRequirements: [],
      transactionRequirements: [],
      bundlerCalls: () => [],
    };
  }

  const {
    bundler3: { generalAdapter1: generalAdapter1Address },
  } = getChainAddresses(chainId);

  return {
    signatureRequirements: [],
    transactionRequirements: [],
    bundlerCalls: () =>
      [
        BundlerAction.nativeTransfer(chainId, accountAddress, generalAdapter1Address, amount), // Will send native from user to GA1
        BundlerAction.wrapNative(chainId, amount, recipientAddress),
      ].flat(),
  };
}
