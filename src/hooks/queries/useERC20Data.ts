// hooks/useFetchERC20DataX.js
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Address } from "viem";
import { useAccount, useConfig } from "wagmi";
import { fetchERC20DataX } from "../../fetch-functions/erc20/fetchERC20DataX.js";

export const HookFetchERC20DataQK = (
  address?: Address,
  userAddress?: Address,
  spender?: Address
) => ["HookFetchERC20Data", address, userAddress, spender] as const;

/**
 * Hook to fetch ERC-20 summary data for a given token and optional user/spender context.
 *
 * @param {{ address?: Address; user?: Address; spender?: Address }} params
 * @param {import('@tanstack/react-query').UseQueryOptions=} options
 */
export function useFetchERC20DataX({
  address,
  user,
  spender,
}: {
  address?: Address;
  user?: Address;
  spender?: Address;
}) {
  const config = useConfig();
  const queryClient = useQueryClient();
  const { address: account } = useAccount();
  const userAddress = user || account;

  return useQuery({
    queryKey: HookFetchERC20DataQK(address, userAddress, spender),
    queryFn: () =>
      fetchERC20DataX(address!, userAddress, spender, queryClient, config),
    enabled: Boolean(address),
  });
}
