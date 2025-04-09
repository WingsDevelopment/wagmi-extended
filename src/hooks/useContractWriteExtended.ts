import { useWriteContract } from "wagmi";
import {
  WriteExtendedAsyncParams,
  useHandleTransactionMutation,
} from "./useHandleTransactionMutation.js";

/**
 * Custom hook for writing to a smart contract using Wagmi.
 *
 * This hook provides functionality for sending a transaction using Wagmi, handling the asynchronous nature of the operation, waiting for the transaction receipt, and error handling.
 *
 * @param {WriteExtendedAsyncParams} [settings] - Optional settings for the write operation.
 * @param {boolean} [settings.disableWaitingForReceipt] - Disables waiting for the transaction receipt.
 * @param {boolean} [settings.disableLogging] - Disables logging the result of the transaction.
 * @param {Function} [settings.onSuccess] - Callback function to be called on successful transaction.
 * @param {Function} [settings.onError] - Callback function to be called on transaction error.
 * @param {Function} [settings.onSettled] - Callback function to be called after the transaction settles (whether success or failure).
 * @param {QueryKey[]} [settings.queriesToInvalidate] - Array of query keys to invalidate after the transaction receives a receipt.
 * @returns {Object} Object containing the following properties:
 * - {boolean} isPending - Indicates whether the transaction is pending.
 * - {string|undefined} errorMessage - The error message, if an error occurred during the transaction.
 * - {Function} writeContractAsync - Function to trigger the write operation.
 */

export function useContractWriteExtended(settings?: WriteExtendedAsyncParams) {
  const { isPending, errorMessage, onMutate, onSettled } =
    useHandleTransactionMutation({
      settings,
    });

  const { writeContractAsync, ...rest } = useWriteContract({
    mutation: {
      onMutate,
      onSettled,
    },
  });

  return {
    ...rest,
    isPending,
    errorMessage,
    writeContractAsync,
  };
}
