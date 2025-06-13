import { ChainId } from "@morpho-org/blue-sdk";
import { InputBundlerOperation } from "@morpho-org/bundler-sdk-viem";
import { SimulationResult, SimulationState } from "@morpho-org/simulation-sdk";
import { Address } from "viem";

import { subbundleFromInputOps } from "../subbundles/subbundleFromInputOps";
import { Action } from "../types";

import { actionFromSubbundles } from "./actionFromSubbundles";

export type MorphoAction =
  | (Extract<Action, { status: "success" }> & {
      status: "success";
      finalSimulationState: SimulationResult[number];
    })
  | Extract<Action, { status: "error" }>;

export function actionFromInputOps(
  chainId: ChainId,
  inputOps: InputBundlerOperation[],
  accountAddress: Address,
  isContract: boolean,
  simulationState: SimulationState,
  executeBundleName: string
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
  } catch (e) {
    return {
      status: "error",
      message: `Simulation Error: ${e instanceof Error ? e.message : JSON.stringify(e)}`,
    };
  }
}
