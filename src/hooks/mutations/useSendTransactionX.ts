import { usePublicClient, useSendTransaction, useWriteContract } from "wagmi";
import {
  useHandleTransactionMutationX,
  WriteExtendedAsyncParams,
} from "./useHandleTransactionMutationX.js";
import { writeContract } from "wagmi/actions";

/**
 * Custom hook for sending a transaction using Wagmi with optional simulation.
 *
 * @param {WriteExtendedAsyncParams} [settings] - Settings for handling transaction lifecycle:
 * @param {boolean} [settings.disableWaitingForReceipt] - Disable waiting for receipt.
 * @param {boolean} [settings.disableLogging] - Disable logging.
 * @param {Function} [settings.onSuccess] - Callback on success.
 * @param {Function} [settings.onError] - Callback on error.
 * @param {Function} [settings.onSettled] - Callback after settlement.
 * @param {Array<import('@tanstack/query-core').QueryKey>} [settings.queriesToInvalidate] - Query keys to invalidate after receipt.
 * @returns {Object} An object containing:
 *   - sendTransaction: Wagmi's sendTransaction function.
 *   - sendTransactionX: Wrapped sendTransaction with optional simulation.
 *   - isPending: Boolean indicating if transaction is in progress.
 *   - errorMessage: Error message if one occurred.
 *
 * @example
 * const { sendTransactionX, isPending, errorMessage } = useSendTransactionX({ onSuccess: ..., onError: ... });
 * await sendTransactionX(
 *   { to, value, data, account, chain },
 *   { abi, functionName, args, chain }
 * );
 */
export function useSendTransactionX(settings?: WriteExtendedAsyncParams) {
  const publicClient = usePublicClient();

  const { isPending, errorMessage, onMutate, onSettled } =
    useHandleTransactionMutationX({
      settings,
    });

  const { sendTransaction, ...rest } = useSendTransaction({
    mutation: {
      onMutate,
      onSettled,
    },
  });

  /**
   * Wraps sendTransaction with an optional simulation step.
   *
   * @param {import('viem').SendTransactionParameters} params - Parameters to sendTransaction.
   * @param {import('viem').SimulateContractParameters} [simulationParams] - Optional parameters to simulate contract call:
   * @param {Array|object} simulationParams.abi - Contract ABI for simulation.
   * @param {string} simulationParams.functionName - Name of the contract function to simulate.
   * @param {any[]} [simulationParams.args] - Arguments for the function call.
   * @param {import('viem').Chain} [simulationParams.chain] - Chain to run the simulation on.
   * @returns {Promise<void>}
   */
  async function sendTransactionX(
    params: Parameters<typeof sendTransaction>[0],
    simulationParams?: Parameters<typeof writeContract>[1]
  ) {
    onMutate();

    try {
      if (params.to && simulationParams) {
        //simulate!
        await publicClient?.simulateContract({
          address: params.to,
          abi: simulationParams.abi,
          functionName: simulationParams.functionName,
          args: simulationParams.args ?? [],
          account: params.account,
          ...(simulationParams.chain != null
            ? { chain: simulationParams.chain }
            : {}),
        });
      }
      // actual send!
      await sendTransaction(params);
    } catch (err) {
      await onSettled(undefined, err, params);
    }
  }

  return {
    ...rest,
    isPending,
    errorMessage,
    sendTransaction,
    sendTransactionX,
  };
}
