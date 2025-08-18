// hooks/useFetchERC4626DataX.js
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Address } from "viem";
import { useAccount, useConfig } from "wagmi";
import { fetchERC4626DataX } from "../../fetch-functions/erc4626/fetchERC4626DataX.js";

export const HookFetchERC4626DataQK = (
  vault?: Address,
  userAddress?: Address,
  spender?: Address
) => ["HookFetchERC4626Data", vault, userAddress, spender] as const;

/**
 * Hook to fetch ERC-4626 vault summary data for a given vault and user/spender.
 *
 * @param {{ vault?: Address; user?: Address; spender?: Address }} params
 * @param {import('@tanstack/react-query').UseQueryOptions=} options
 */
export function useFetchERC4626DataX({
  vault,
  user,
  spender,
}: {
  vault?: Address;
  user?: Address;
  spender?: Address;
}) {
  const config = useConfig();
  const queryClient = useQueryClient();
  const { address: account } = useAccount();
  const userAddress = user || account;

  return useQuery({
    queryKey: HookFetchERC4626DataQK(vault, userAddress, spender),
    queryFn: () =>
      fetchERC4626DataX(vault!, userAddress, spender, queryClient, config),
    enabled: Boolean(vault),
  });
}
