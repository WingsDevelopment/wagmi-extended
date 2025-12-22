import { waitForTransactionReceipt } from "wagmi/actions"
import { useConfig } from "wagmi"
import { Query, QueryKey } from "@tanstack/query-core"
import { Address, TransactionReceipt, WaitForTransactionReceiptParameters } from "viem"
import { useState } from "react"
import { useInvalidateQueries } from "./useInvalidateQueries.js"
import { useQueryClient } from "@tanstack/react-query"
import { getParsedErrorX } from "../../utils/errorParserX.js"

export type WriteExtendedAsyncParams = {
  onSuccess?: (txHash: Address, txReceipt?: TransactionReceipt) => void
  onError?: (e: any) => void
  onSettled?: () => void

  onSuccessAsync?: (txHash: Address, txReceipt?: TransactionReceipt) => Promise<void>
  onErrorAsync?: (e: any) => Promise<void>
  onSettledAsync?: () => Promise<void>

  /** simple list of keys to invalidate */
  queriesToInvalidate?: (QueryKey | undefined)[]
  /** a predicate to decide which queries to invalidate */
  invalidatePredicate?: (query: Query<unknown, unknown>) => boolean

  disableLogging?: boolean
  disableWaitingForReceipt?: boolean

  waitForTransactionReceiptParameters?: Omit<WaitForTransactionReceiptParameters, "hash">
}

/**
 * Custom hook to handle transaction mutations.
 *
 * @returns {Function} A shared `onSettled` callback for transaction mutations.
 */
export function useHandleTransactionMutationX({
  settings,
}: {
  settings?: WriteExtendedAsyncParams
}) {
  const wagmiConfig = useConfig()
  const queryClient = useQueryClient()

  const { invalidateMany } = useInvalidateQueries()
  const [isPending, setIsPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)

  const onMutate = () => {
    setIsPending(true)
    setErrorMessage(undefined)
  }

  const onSettled = async (txHash: Address | undefined, error: any, args: any) => {
    try {
      if (error) throw error

      let txReceipt: TransactionReceipt | undefined

      if (!settings?.disableWaitingForReceipt) {
        // 1. wait for transaction receipt
        txReceipt = await waitForTransactionReceipt(wagmiConfig, {
          hash: txHash!,
          ...settings?.waitForTransactionReceiptParameters,
        })

        // 2. throw if receipt is not valid
        if (txReceipt.status === "reverted") throw new Error("Execution reverted.")
        if (txReceipt.status !== "success") throw new Error("Execution reverted.")
      }

      // 3. invalidate queries
      const { queriesToInvalidate, invalidatePredicate } = settings || {}

      if (invalidatePredicate) {
        // 1) predicate-based
        await queryClient.invalidateQueries({
          predicate: invalidatePredicate,
        })
      }
      if (queriesToInvalidate) {
        // 2) explicit key list
        await invalidateMany(queriesToInvalidate)
      }

      // 4. call onSuccess callback
      settings?.onSuccess?.(txHash!, txReceipt)
      if (settings?.onSuccessAsync) await settings.onSuccessAsync(txHash!, txReceipt)

      if (!settings?.disableLogging) {
        // 5. log result
        // eslint-disable-next-line no-console
        console.info("Operation successful:", txHash) // todo: add logging service
      }
      // 6. return result
      return txHash
    } catch (error) {
      const parsedError = getParsedErrorX(error)

      if (!settings?.disableLogging) {
        // 1. log error
        console.error(
          `ContractWriteExtended Operation failed with error(parsed): ${parsedError}`,
          { error },
          { args }
        )
        console.error({ error })
      }
      // 2. set error message
      setErrorMessage(parsedError)

      // 3. call callback
      settings?.onError?.(error)
      if (settings?.onErrorAsync) await settings.onErrorAsync(error)
    } finally {
      setIsPending(false)
      // 1. call callback
      settings?.onSettled?.()
      if (settings?.onSettledAsync) await settings.onSettledAsync()
    }
    return undefined
  }

  return {
    onMutate,
    onSettled,
    isPending,
    errorMessage,
  }
}
