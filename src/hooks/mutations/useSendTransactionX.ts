import { usePublicClient, useSendTransaction, useWriteContract } from "wagmi";
import {
  useHandleTransactionMutationX,
  WriteExtendedAsyncParams,
} from "./useHandleTransactionMutationX.js";
import { writeContract } from "wagmi/actions";

/**
 * Custom hook for sending a transaction using Wagmi.
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
 * - {Function} sendTransactionAsync - Function to trigger the send transaction mutation.

 * @example
 * // In your component:
 * function MyTransactionComponent() {
 *   const { sendTransactionAsync, isPending, errorMessage } = useSendTransactionX({
 *     // use calbacks here in useContractWriteX or in writeContractAsync
 *     onSuccess: (txHash) => console.log("Transaction successful:", txHash),
 *     onError: (error) => console.error("Transaction error:", error),
 *     queriesToInvalidate: [["userBalance"], ["userActivity"]],
 *   });
 *
 *   const handleSend = async () => {
 *     try {
 *       const txHash = await sendTransactionAsync({ transaction params here.. });
 *       console.log("Received txHash:", txHash);
 *     } catch (err) {
 *       console.error("Failed sending transaction:", err);`
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleSend} disabled={isPending}>
 *         {isPending ? "Processing..." : "Send Transaction"}
 *       </button>
 *       {errorMessage && <p>Error: {errorMessage}</p>}
 *     </div>
 *   );
 * }
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
   * Wraps sendTransaction with an optional simulation.
   */
  async function simulateAsyncAndSendTransaction(
    params: Parameters<typeof sendTransaction>[0],
    simulationParams: Parameters<typeof writeContract>[1]
  ) {
    onMutate();

    try {
      if (params.to) {
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
    simulateAsyncAndSendTransaction,
  };
}
