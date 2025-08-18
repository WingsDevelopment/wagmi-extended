import type { Address, Hex } from "viem";
import type { QueryClient } from "@tanstack/react-query";
import type { Config } from "wagmi";
import { getPublicClient } from "wagmi/actions";
import { queryConfig } from "../../query-config/index.js";
import { ensureClientAndConfig } from "../../utils/ensureClientAndConfig.js";

/** Reusable React Query key helper for deployment block lookups. */
export const deploymentBlockKey = (
  chainId: number | undefined,
  address: Address | undefined,
  floor: bigint
) => ["deploymentBlock", chainId, address?.toLowerCase(), floor] as const;

/**
 * Internal helper: checks if there is bytecode at `address` on `blockNumber`.
 */
async function hasCodeAtX(
  address: Address,
  blockNumber: bigint,
  wagmiConfig: Config
): Promise<boolean> {
  const client = getPublicClient(wagmiConfig);
  if (!client) throw new Error("Public client is missing");
  const code: Hex | undefined = await client.getCode({ address, blockNumber });
  return !!code && code !== "0x";
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
  const client = getPublicClient(wagmiConfig);
  if (!client) throw new Error("Public client is missing");

  const latest = await client.getBlockNumber();
  if (!(await hasCodeAtX(address, latest, wagmiConfig))) {
    const chainId = client.chain?.id ?? 0;
    throw new Error(
      `No code for ${address} at latest block ${latest} on chain ${chainId}.`
    );
  }

  // If caller-supplied floor already has code, it *is* the first code block.
  if (floor > 0n && (await hasCodeAtX(address, floor, wagmiConfig)))
    return floor;

  // Exponential descent to find a "no code" lower bound fast.
  let lo = floor; // known (or assumed) no code
  let hi = latest; // known has code
  let step = 1n;

  while (hi - step > lo) {
    const probe = hi - step;
    if (await hasCodeAtX(address, probe, wagmiConfig)) {
      hi = probe; // still has code -> move upper bound down
      step <<= 1n; // double the step
    } else {
      lo = probe; // found a no-code block
      break;
    }
  }

  // Binary search to the first block with code in (lo, hi]
  while (lo + 1n < hi) {
    const mid = lo + (hi - lo) / 2n;
    if (await hasCodeAtX(address, mid, wagmiConfig)) hi = mid;
    else lo = mid;
  }
  return hi;
}

/**
 * Builds React Query options for caching the deployment block "forever".
 *
 * Use with `queryClient.fetchQuery(...)`.
 *
 * @param address     - Contract address to probe.
 * @param floor       - Optional lower bound (inclusive) to speed up search. Defaults to `0n`.
 * @param wagmiConfig - Wagmi `Config` (optional; resolved via `ensureClientAndConfig` if omitted).
 *
 * @returns A fully-configured query options object (key + fn + metadata).
 */
export function getDeploymentBlockQueryOptionsX(
  address: Address,
  floor: bigint = 0n,
  wagmiConfig?: Config
) {
  if (!address) throw new Error("Address is required");

  // Resolve config (caller may pass undefined; we'll normalize later in fetcher too)
  // We only need chainId for the key; if wagmiConfig is missing here,
  // we allow it since fetcher re-resolves. But key stability benefits from chainId.
  const client = wagmiConfig ? getPublicClient(wagmiConfig) : undefined;
  const chainId = client?.chain?.id;

  return {
    queryKey: deploymentBlockKey(chainId, address, floor),
    queryFn: async () => {
      if (!wagmiConfig)
        throw new Error("wagmiConfig is required at execution time");
      return findDeploymentBlockRpcX(address, wagmiConfig, floor);
    },
    ...queryConfig.metaDataQuery,
  } as const;
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
 * - For long-lived results, we apply `queryConfig.metaDataQuery` (tweak as needed).
 *
 * #### Performance
 * - **O(log N)** `eth_getCode` calls, where `N` is the gap between the latest
 *   block and the deployment block—optimal among comparison-based strategies.
 *
 * @example
 * ```ts
 * const block = await fetchDeploymentBlockX("0xContract...", 0n, queryClient, wagmiConfig);
 * ```
 *
 * @param address - Contract address to probe.
 * @param floor - Optional lower bound (inclusive) to speed up search. Defaults to `0n`.
 * @param queryClient - Optional TanStack `QueryClient`. If omitted, resolved by `ensureClientAndConfig`.
 * @param wagmiConfig - Optional Wagmi `Config`. If omitted, resolved by `ensureClientAndConfig`.
 *
 * @returns The earliest block number (bigint) where bytecode exists.
 *
 * @throws If the public client is missing or if no code is present at the latest block.
 */
export async function fetchDeploymentBlockX(
  address: Address,
  floor: bigint = 0n,
  queryClient?: QueryClient,
  wagmiConfig?: Config
): Promise<bigint> {
  if (!address) throw new Error("Address is required");

  ({ queryClient, wagmiConfig } = ensureClientAndConfig(
    queryClient,
    wagmiConfig
  ));

  // Resolve chainId for a stable cache key
  const client = getPublicClient(wagmiConfig);
  const chainId = client?.chain?.id;
  if (!chainId) throw new Error("Client chain ID is missing");

  return queryClient.fetchQuery({
    ...getDeploymentBlockQueryOptionsX(address, floor, wagmiConfig),
    // Ensure the final key includes a concrete chainId
    queryKey: deploymentBlockKey(chainId, address, floor),
    // Reinstate metadata (in case your ensure/util merges)
    ...queryConfig.metaDataQuery,
  });
}
