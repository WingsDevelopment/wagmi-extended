import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { useConfig } from "wagmi";
import { fetchTokenX } from "../fetch-functions/fetchTokenX.js";

/**
 * Returns a query key for fetching token data.
 *
 * @param {Address | undefined} asset - The token address.
 * @returns {Array} A unique query key for the token fetch.
 *
 * @example
 * const queryKey = HookFetchTokenQK("0x123...");
 */
export const HookFetchTokenQK = (asset?: Address): any[] => [
  "HookTokenWagmiExtended",
  asset,
];

/**
 * Custom hook for fetching token metadata using extended Wagmi functionality.
 *
 * This hook leverages React Query for data fetching and caching.
 * It retrieves token metadata (such as symbol, decimals, name, etc.) for a given token address.
 *
 * @param {Address} [asset] - The token address.
 * @returns {Object} An object with the following properties:
 *   - `data`: The token data (or undefined if not loaded).
 *   - `isLoading`: Boolean indicating if the data is loading.
 *   - `error`: Any error encountered during the fetch.
 *   - `queryKey`: The unique key used for the query.
 *
 * @example
 * // In your component:
 * function MyTokenComponent() {
 *   const { data, isLoading, error, queryKey } = useTokenX("0x123456...");
 *
 *   if (isLoading) return <div>Loading token data...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return (
 *     <div>
 *       <p>Token Symbol: {data.symbol}</p>
 *       <p>Decimals: {data.decimals}</p>
 *       <p>Name: {data.name}</p>
 *     </div>
 *   );
 * }
 */
export const useTokenX = (asset?: Address) => {
  const queryClient = useQueryClient();
  const config = useConfig();

  const { data, ...rest } = useQuery({
    queryKey: HookFetchTokenQK(asset),
    queryFn: () => fetchTokenX(asset!, queryClient, config),
    enabled: Boolean(asset),
  });

  return {
    ...rest,
    data,
    queryKey: HookFetchTokenQK(asset),
  };
};
