import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Address, erc20Abi } from "viem";
import { useAccount, useConfig } from "wagmi";
import { fetchAllowanceX } from "../../fetch-functions/erc20/fetchAllowanceX.js";
import { queryConfig } from "../../query-config/index.js";

export const HookFetchAssetAllowanceQK = (
  asset?: Address,
  spender?: Address,
  userAddress?: Address
) => ["HookFetchAllowance", asset, spender, userAddress] as const;

/**
 * Custom hook for fetching asset allowance.
 *
 * @param {Address} asset - The address of the ERC20 token contract.
 * @param {Address} spender - The address of the spender to check allowance for.
 *
 *
 * @example
 * // In your component:
 * function AllowanceDisplay() {
 *   const { data: allowance, isLoading, error } = useFetchAssetAllowanceX({
 *     asset: "0xTokenAddressExample",
 *     spender: "0xSpenderAddressExample",
 *   });
 *
 *   if (isLoading) return <div>Loading allowance...</div>;
 *   if (error) return <div>Error loading allowance</div>;
 *
 *   return (
 *     <div>
 *       Current Allowance: {allowance}
 *     </div>
 *   );
 * }
 */
export const useFetchAssetAllowanceX = ({
  asset,
  spender,
}: {
  asset?: Address;
  spender?: Address;
}) => {
  const config = useConfig();
  const queryClient = useQueryClient();
  const { address: userAddress } = useAccount();

  const { data, ...rest } = useQuery({
    queryKey: HookFetchAssetAllowanceQK(asset, spender, userAddress),
    queryFn: () =>
      fetchAllowanceX(asset!, spender!, userAddress!, queryClient, config),
    enabled: Boolean(asset) && Boolean(spender) && Boolean(userAddress),
    ...queryConfig.lowSensitiveQuery,
  });

  return {
    ...rest,
    data,
    queryKey: HookFetchAssetAllowanceQK(asset, spender, userAddress),
  };
};
