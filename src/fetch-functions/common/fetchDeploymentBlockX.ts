import type { Address, Hex } from "viem"
import type { QueryClient } from "@tanstack/react-query"
import type { Config } from "wagmi"
import { getPublicClient } from "wagmi/actions"
import { queryConfig } from "../../query-config/index.js"
import { ensureClientAndConfig } from "../../utils/ensureClientAndConfig.js"

/** Reusable React Query key helper for deployment block lookups. */
export const deploymentBlockKey = (
  chainId: bigint | undefined,
  address: Address | undefined,
  floor: bigint
) => ["deploymentBlock", chainId, address?.toLowerCase(), floor] as const

/** Internal: SSR-safe localStorage guards */
const canUseBrowserStorage =
  typeof window !== "undefined" && typeof window.localStorage !== "undefined"

/** Internal: build a stable localStorage key */
const lsKeyForDeploymentBlock = (chainId: bigint, address: Address, floor: bigint) =>
  `wagmi-extended:deploymentBlock:${chainId}:${address.toLowerCase()}:${floor.toString()}`

/** Internal: read bigint from localStorage (SSR safe) */
function readDeploymentBlockFromLS(
  chainId: bigint,
  address: Address,
  floor: bigint
): bigint | undefined {
  if (!canUseBrowserStorage) return undefined
  try {
    const raw = window.localStorage.getItem(lsKeyForDeploymentBlock(chainId, address, floor))
    return raw ? BigInt(raw) : undefined
  } catch {
    return undefined
  }
}

/** Internal: write bigint to localStorage (SSR safe) */
function writeDeploymentBlockToLS(chainId: bigint, address: Address, floor: bigint, value: bigint) {
  if (!canUseBrowserStorage) return
  try {
    window.localStorage.setItem(lsKeyForDeploymentBlock(chainId, address, floor), value.toString())
  } catch {
    /* ignore quota/security errors */
  }
}

/**
 * Internal helper: checks if there is bytecode at `address` on `blockNumber`.
 */
async function hasCodeAtX(
  address: Address,
  blockNumber: bigint,
  wagmiConfig: Config
): Promise<boolean> {
  const client = getPublicClient(wagmiConfig)
  if (!client) throw new Error("Public client is missing")
  const code: Hex | undefined = await client.getCode({ address, blockNumber })
  return !!code && code !== "0x"
}

/**
 * Internal helper: finds the earliest block where code exists at `address`,
 * using exponential descent to find a lower bound and then binary search.
 *
 * @param address - Contract address to probe.
 * @param floor   - Optional lower bound (inclusive) to start from. If you know
 *                  the contract cannot exist below this block, pass it to
 *                  speed up the search. Defaults to `0n`.
 * @returns The first block number (bigint) where code is present.
 * @throws  If no code exists at the latest block (i.e., contract not deployed).
 */
async function findDeploymentBlockRpcX(
  address: Address,
  wagmiConfig: Config,
  floor: bigint = 0n
): Promise<bigint> {
  const client = getPublicClient(wagmiConfig)
  if (!client) throw new Error("Public client is missing")

  const latest = await client.getBlockNumber()
  if (!(await hasCodeAtX(address, latest, wagmiConfig))) {
    const chainId = client.chain?.id ?? 0
    throw new Error(`No code for ${address} at latest block ${latest} on chain ${chainId}.`)
  }

  // If caller-supplied floor already has code, it *is* the first code block.
  if (floor > 0n && (await hasCodeAtX(address, floor, wagmiConfig))) return floor

  // Exponential descent to find a "no code" lower bound fast.
  let lo = floor // known (or assumed) no code
  let hi = latest // known has code
  let step = 1n

  while (hi - step > lo) {
    const probe = hi - step
    if (await hasCodeAtX(address, probe, wagmiConfig)) {
      hi = probe // still has code -> move upper bound down
      step <<= 1n // double the step
    } else {
      lo = probe // found a no-code block
      break
    }
  }

  // Binary search to the first block with code in (lo, hi]
  while (lo + 1n < hi) {
    const mid = lo + (hi - lo) / 2n
    if (await hasCodeAtX(address, mid, wagmiConfig)) hi = mid
    else lo = mid
  }
  return hi
}

/**
 * Builds React Query options for caching the deployment block "forever".
 *
 * Use with `queryClient.fetchQuery(...)`.
 *
 * @param address            - Contract address to probe.
 * @param floor              - Optional lower bound (inclusive) to speed up search. Defaults to `0n`.
 * @param wagmiConfig        - Wagmi `Config` (optional; resolved via `ensureClientAndConfig` if omitted).
 * @param options.disableLocalStorage - If `true`, skip reading/writing localStorage (default `false`).
 *
 * Local Storage behavior (SSR-safe):
 * - If not disabled and a value exists in `localStorage`, the `queryFn` will
 *   return it immediately without performing RPC calls.
 * - After an on-chain discovery, the result is written to `localStorage`
 *   (unless disabled). This pairs nicely with `staleTime: Infinity` to
 *   avoid future refetches.
 */
export function getDeploymentBlockQueryOptionsX(
  address: Address,
  floor: bigint = 0n,
  wagmiConfig?: Config,
  options?: { disableLocalStorage?: boolean; chainId?: bigint }
) {
  if (!address) throw new Error("Address is required")
  const disableLocalStorage = options?.disableLocalStorage ?? false

  // Resolve config (caller may pass undefined; we'll normalize later in fetcher too)
  // We only need chainId for the key; if wagmiConfig is missing here,
  // we allow it since fetcher re-resolves. But key stability benefits from chainId.
  const client = wagmiConfig ? getPublicClient(wagmiConfig) : undefined
  const chainId = options?.chainId || client?.chain?.id
  const finalChainId = chainId ? BigInt(chainId) : undefined

  return {
    queryKey: deploymentBlockKey(finalChainId, address, floor),
    queryFn: async () => {
      if (!wagmiConfig) throw new Error("wagmiConfig is required at execution time")

      const c = getPublicClient(wagmiConfig)
      if (!finalChainId) throw new Error("Client chain ID is missing")

      // Try localStorage first (no refetches if we already know it)
      if (!disableLocalStorage) {
        const fromLS = readDeploymentBlockFromLS(finalChainId, address, floor)
        if (fromLS !== undefined) return fromLS
      }

      // Otherwise do the discovery via RPC
      const discovered = await findDeploymentBlockRpcX(address, wagmiConfig, floor)

      // Persist to localStorage for subsequent sessions
      if (!disableLocalStorage) {
        writeDeploymentBlockToLS(finalChainId, address, floor, discovered)
      }
      return discovered
    },
    ...queryConfig.metaDataQuery, // typically sets staleTime: Infinity, gcTime, etc.
  } as const
}

/**
 * Fetches (and caches) the first block where contract bytecode exists at `address`.
 *
 * Uses your shared `QueryClient` and Wagmi `Config` like other `fetch*X` helpers.
 * Internally, this runs an **exponential descent** to find a safe lower bound,
 * followed by an **optimal binary search** to pinpoint the exact deployment block.
 *
 * #### Caching
 * - Query key: `["deploymentBlock", chainId, address.toLowerCase(), floor]`
 * - Long-lived results: `queryConfig.metaDataQuery` (e.g., `staleTime: Infinity`)
 *
 * #### Local Storage (SSR-safe)
 * - Before calling `fetchQuery`, we seed the Query Cache from `localStorage`
 *   (unless `disableLocalStorage` is true). When a cached value is present,
 *   `fetchQuery` will *not* execute the `queryFn`, fully preventing RPC refetches.
 * - After on-chain discovery, the result is written back to `localStorage`
 *   (unless disabled).
 *
 * @example
 * ```ts
 * const block = await fetchDeploymentBlockX(
 *   "0xContract...",
 *   0n,
 *   queryClient,
 *   wagmiConfig,
 *   { disableLocalStorage: false }
 * );
 * ```
 *
 * @param address                   - Contract address to probe.
 * @param floor                     - Optional lower bound (inclusive). Defaults to `0n`.
 * @param queryClient               - Optional TanStack `QueryClient`. If omitted, resolved by `ensureClientAndConfig`.
 * @param wagmiConfig               - Optional Wagmi `Config`. If omitted, resolved by `ensureClientAndConfig`.
 * @param options.disableLocalStorage - If `true`, skip reading/writing localStorage (default `false`).
 *
 * @returns The earliest block number (bigint) where bytecode exists.
 *
 * @throws If the public client is missing or if no code is present at the latest block.
 */
export async function fetchDeploymentBlockX(
  address: Address,
  floor: bigint = 0n,
  options?: { disableLocalStorage?: boolean; chainId?: bigint },
  queryClient?: QueryClient,
  wagmiConfig?: Config
): Promise<bigint> {
  if (!address) throw new Error("Address is required")

  ;({ queryClient, wagmiConfig } = ensureClientAndConfig(queryClient, wagmiConfig))

  const client = getPublicClient(wagmiConfig)
  const chainId = options?.chainId || client?.chain?.id
  const finalChainId = chainId ? BigInt(chainId) : undefined
  if (!finalChainId) throw new Error("Client chain ID is missing")

  const key = deploymentBlockKey(finalChainId, address, floor)
  const disableLocalStorage = options?.disableLocalStorage ?? false

  // Seed cache from localStorage so fetchQuery returns immediately w/o running queryFn
  if (!disableLocalStorage) {
    const fromLS = readDeploymentBlockFromLS(finalChainId, address, floor)
    if (fromLS !== undefined) {
      queryClient.setQueryData(key, fromLS)
    }
  }

  return queryClient.fetchQuery({
    ...getDeploymentBlockQueryOptionsX(address, floor, wagmiConfig, {
      disableLocalStorage,
    }),
    // Ensure the final key includes a concrete chainId
    queryKey: key,
    // Reinstate metadata (in case your ensure/util merges)
    ...queryConfig.metaDataQuery,
  })
}
