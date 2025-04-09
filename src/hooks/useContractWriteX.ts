import { useWriteContract } from "wagmi";
import {
  WriteExtendedAsyncParams,
  useHandleTransactionMutationX,
} from "./useHandleTransactionMutationX.js";

/**
 * Custom hook for writing to a smart contract using Wagmi.
 *
 * This hook provides functionality for writing a contract using Wagmi, handling the asynchronous nature of the operation, waiting for the transaction receipt, and error handling.
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
 * 
/**
 * Custom hook for writing a contract using Wagmi with extended functionality.
 *
 * This hook wraps Wagmi’s `useContractWriteX` with additional handling for
 * waiting for a transaction receipt, logging control, and invalidation of specified queries.
 *
 * @param {WriteExtendedAsyncParams} [settings] - Optional settings for handling the transaction.
 * @returns {Object} An object containing:
 *   - `isPending`: {boolean} indicating if the transaction is in progress.
 *   - `errorMessage`: {string|undefined} a potential error message.
 *   - `writeContractAsync`: {Function} a function to trigger the transaction.
 *
 * @example
 * // In your component:
 * function MyTransactionComponent() {
 *   const { writeContractAsync, isPending, errorMessage } = useContractWriteX({
 *     queriesToInvalidate: [["userBalance"], ["userActivity"]],
 *   });
 *
 *   const handleWrite = async () => {
 *     try {
 *       const txHash = await writeContractAsync({ transaction params here.. }, {
 *          // use calbacks here in writeContractAsync or in useContractWriteX
 *          onSuccess: (txHash) => console.log("Transaction successful:", txHash),
 *          onError: (error) => console.error("Transaction error:", error),
 *       });
 *       console.log("Received txHash:", txHash);
 *     } catch (err) {
 *       console.error("Failed writing transaction:", err);`
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleWrite} disabled={isPending}>
 *         {isPending ? "Processing..." : "Write Transaction"}
 *       </button>
 *       {errorMessage && <p>Error: {errorMessage}</p>}
 *     </div>
 *   );
 * }
 */

export function useContractWriteX(settings?: WriteExtendedAsyncParams) {
  const { isPending, errorMessage, onMutate, onSettled } =
    useHandleTransactionMutationX({
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
