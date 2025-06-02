import { DEFAULT_SLIPPAGE_TOLERANCE, getChainAddresses } from "@morpho-org/blue-sdk";
import { produceImmutable } from "@morpho-org/simulation-sdk";
import { Address, maxUint256 } from "viem";

import { getIsContract } from "@/actions/data/rpc/getIsContract";
import { getSimulationState } from "@/actions/data/rpc/getSimulationState";

import { inputTransferSubbundle } from "../subbundles/inputTransferSubbundle";
import { subbundleFromInputOps } from "../subbundles/subbundleFromInputOps";
import { actionFromSubbundles } from "../utils/actionFromSubbundles";
import { computeVaultPositionChange } from "../utils/positionChange";
import { PublicClientWithChain, VaultAction } from "../utils/types";

interface VaultSupplyActionParameters {
  publicClient: PublicClientWithChain;
  vaultAddress: Address;
  accountAddress: Address;
  supplyAmount: bigint; // Max uint256 for entire account balanace
  allowWrappingNativeAssets: boolean; // Ignored if the vault asset is not wrapped native
}

export async function vaultSupplyAction({
  publicClient,
  vaultAddress,
  accountAddress,
  supplyAmount,
  allowWrappingNativeAssets = false,
}: VaultSupplyActionParameters): Promise<VaultAction> {
  // Will throw is unsupported chainId
  const {
    bundler3: { generalAdapter1: generalAdapter1Address },
  } = getChainAddresses(publicClient.chain.id);

  if (supplyAmount <= 0n) {
    return {
      status: "error",
      message: "Supply amount must be greater than 0.",
    };
  }

  const [intitialSimulationState, accountIsContract] = await Promise.all([
    getSimulationState({
      actionType: "vault",
      accountAddress,
      vaultAddress,
      publicClient,
    }),
    getIsContract(publicClient, accountAddress),
  ]);

  const vault = intitialSimulationState.getVault(vaultAddress);
  const isMaxSupply = supplyAmount === maxUint256;

  try {
    const intermediateSimulationState = produceImmutable(intitialSimulationState, () => {});

    const inputSubbundle = inputTransferSubbundle({
      chainId: publicClient.chain.id,
      accountAddress,
      tokenAddress: vault.underlying,
      amount: supplyAmount, // Handles maxUint256
      recipientAddress: generalAdapter1Address,
      config: {
        accountSupportsSignatures: !accountIsContract,
        tokenIsRebasing: false,
        allowWrappingNativeAssets,
      },
      simulationState: intermediateSimulationState,
    });

    const ga1AssetBalance = intermediateSimulationState.getHolding(generalAdapter1Address, vault.asset).balance;

    const vaultSupplySubbundle = subbundleFromInputOps({
      chainId: publicClient.chain.id,
      inputOps: [
        {
          type: "MetaMorpho_Deposit",
          sender: accountAddress,
          address: vaultAddress,
          args: {
            assets: isMaxSupply ? ga1AssetBalance : supplyAmount,
            owner: accountAddress,
            slippage: DEFAULT_SLIPPAGE_TOLERANCE,
          },
        },
      ],
      accountAddress,
      accountSupportsSignatures: !accountIsContract,
      simulationState: intermediateSimulationState,
      throwIfRequirements: true,
    });

    return {
      ...actionFromSubbundles(publicClient.chain.id, [inputSubbundle, vaultSupplySubbundle], "Confirm Supply"),
      positionChange: computeVaultPositionChange(
        vaultAddress,
        accountAddress,
        intitialSimulationState,
        vaultSupplySubbundle.finalSimulationState
      ),
    };
  } catch (e) {
    return {
      status: "error",
      message: `Simulation Error: ${(e instanceof Error ? e.message : JSON.stringify(e)).split("0x")[0]}`,
    };
  }
}
