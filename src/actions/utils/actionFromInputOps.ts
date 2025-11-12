import type { ChainId } from "@morpho-org/blue-sdk";
import type { InputBundlerOperation } from "@morpho-org/bundler-sdk-viem";
import type { SimulationResult, SimulationState } from "@morpho-org/simulation-sdk";
import type { Address } from "viem";

import { subbundleFromInputOps } from "../subbundles/subbundleFromInputOps";
import { type Action, UserFacingError } from "../types";

import { actionFromSubbundles } from "./actionFromSubbundles";

export type MorphoAction = Action & { finalSimulationState: SimulationResult[number] };

export function actionFromInputOps(
  chainId: ChainId,
  inputOps: InputBundlerOperation[],
  accountAddress: Address,
  isContract: boolean,
  simulationState: SimulationState,
  executeBundleName: string,
): MorphoAction {
  try {
    const subbundle = subbundleFromInputOps({
      chainId,
      inputOps,
      accountAddress,
      accountSupportsSignatures: !isContract,
      simulationState,
    });

    return {
      ...actionFromSubbundles(chainId, [subbundle], executeBundleName),
      finalSimulationState: subbundle.finalSimulationState,
    };
  } catch (error) {
    throw new UserFacingError(`Simulation Error: ${error instanceof Error ? error.message : JSON.stringify(error)}`, {
      cause: error,
    });
  }
}
