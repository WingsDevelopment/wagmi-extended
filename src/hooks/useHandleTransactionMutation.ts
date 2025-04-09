import { waitForTransactionReceipt } from "wagmi/actions";
import { useInvalidateQueries } from "./useInvalidateQueries";
import { useConfig } from "wagmi";
import { QueryKey } from "@tanstack/query-core";
import { Address } from "viem";
import { useState } from "react";
import { getParsedError } from "../utils/errorParser";

export type WriteExtendedAsyncParams = {
  onSuccess?: (txHash: Address) => void;
  onError?: (e: any) => void;
  onSettled?: () => void;
  queriesToInvalidate?: (QueryKey | undefined)[];
  disableLogging?: boolean;
  disableWaitingForReceipt?: boolean;
};

/**
 * Custom hook to handle transaction mutations.
 *
 * @returns {Function} A shared `onSettled` callback for transaction mutations.
 */
export function useHandleTransactionMutation({
  settings,
}: {
  settings?: WriteExtendedAsyncParams;
}) {
  const wagmiConfig = useConfig();

  const { invalidateMany } = useInvalidateQueries();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );

  const onMutate = () => {
    setIsPending(true);
    setErrorMessage(undefined);
  };

  const onSettled = async (
    txHash: Address | undefined,
    error: any,
    args: any
  ) => {
    try {
      if (error) throw error;

      if (!settings?.disableWaitingForReceipt) {
        // 1. wait for transaction receipt
        const txReceipt = await waitForTransactionReceipt(wagmiConfig, {
          hash: txHash!,
        });

        // 2. throw if receipt is not valid
        if (txReceipt.status === "reverted")
          throw new Error("Execution reverted.");
        if (txReceipt.status !== "success")
          throw new Error("Execution reverted.");
      }

      // 3. invalidate queries
      if (settings?.queriesToInvalidate)
        await invalidateMany(settings?.queriesToInvalidate);

      // 4. call onSuccess callback
      settings?.onSuccess?.(txHash!);

      if (!settings?.disableLogging) {
        // 5. log result
        // eslint-disable-next-line no-console
        console.info("Operation successful:", txHash); // todo: add logging service
      }
      // 6. return result
      return txHash;
    } catch (error) {
      const parsedError = getParsedError(error);

      if (!settings?.disableLogging) {
        // 1. log error
        console.error(
          `ContractWriteExtended Operation failed with error(parsed): ${parsedError}`,
          { error },
          { args }
        );
        console.error({ error });
      }
      // 2. set error message
      setErrorMessage(parsedError);

      // 3. call callback
      settings?.onError?.(error);
    } finally {
      setIsPending(false);
      // 1. call callback
      settings?.onSettled?.();
    }
    return undefined;
  };

  return {
    onMutate,
    onSettled,
    isPending,
    errorMessage,
  };
}
