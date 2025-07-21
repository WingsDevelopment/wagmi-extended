import { usePublicClient, useSimulateContract, useWriteContract } from "wagmi";
import {
  WriteExtendedAsyncParams,
  useHandleTransactionMutationX,
} from "./useHandleTransactionMutationX.js";
import { Address } from "viem";

/**
 * Custom hook for writing to a smart contract using Wagmi with optional simulation.
 *
 * @param {WriteExtendedAsyncParams} settings - Settings for handling transaction lifecycle:
 * @param {boolean} [settings.disableWaitingForReceipt] - Disable waiting for receipt.
 * @param {boolean} [settings.disableLogging] - Disable logging.
 * @param {Function} [settings.onSuccess] - Callback invoked on successful transaction receipt.
 * @param {Function} [settings.onError] - Callback invoked on simulation or transaction error.
 * @param {Function} [settings.onSettled] - Callback invoked after transaction settles.
 * @param {Array<import('@tanstack/query-core').QueryKey>} [settings.queriesToInvalidate] - Query keys to invalidate after receipt.
 * @returns {Object} An object containing:
 *   - writeContract: Wagmi's writeContract function.
 *   - writeContractX: Wrapped writeContract with optional simulation.
 *   - isPending: Boolean indicating if transaction is in progress.
 *   - errorMessage: Error message if one occurred.
 *
 * @example
 * const { writeContractX, isPending, errorMessage } = useContractWriteX({ onSuccess: ..., onError: ... });
 * await writeContractX(
 *   { abi, address, functionName, args, account, chain, value },
 *   disable simulation? = false
 * );
 */
export function useContractWriteX(settings: WriteExtendedAsyncParams) {
  const publicClient = usePublicClient();

  const { isPending, errorMessage, onMutate, onSettled } =
    useHandleTransactionMutationX({ settings });

  // Underlying Wagmi write hook:
  const wagmiWrite = useWriteContract({
    mutation: { onMutate, onSettled },
  });

  async function writeContractX(
    params: Parameters<typeof wagmiWrite.writeContract>[0],
    disableSimulation = false
  ) {
    // 0) signal start
    onMutate();

    try {
      // 1) optional dry-run
      const { chain, ...others } = params;

      if (!disableSimulation) {
        await publicClient?.simulateContract({
          ...others,
          ...(chain != null ? { chain } : {}),
        });
      }

      wagmiWrite.writeContract(params);
    } catch (err) {
      await onSettled(undefined, err, params);
    }
  }

  return {
    ...wagmiWrite,
    writeContractX,
    isPending,
    errorMessage,
  };
}
