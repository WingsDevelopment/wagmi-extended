import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Address, erc20Abi } from "viem";
import { readContract } from "viem/actions";
import { useAccount, useConfig } from "wagmi";
import { fetchToken } from "./useToken.js";
import { queryConfig } from "../query-config/index.js";

export const fetchAllowance = async (
  asset: Address,
  spender: Address,
  userAddress: Address,
  queryClient: any,
  config: any
) => {
  const [tokenData, allowance] = await Promise.all([
    fetchToken(asset, queryClient, config),
    readContract(config, {
      address: asset,
      abi: erc20Abi,
      functionName: "allowance",
      args: [userAddress, spender],
    }),
  ]);

  if (!tokenData || allowance == null) {
    throw new Error("Failed to fetch token data or allowance");
  }

  return {
    bigIntValue: allowance,
    decimals: tokenData.decimals,
    symbol: tokenData.symbol,
  };
};

const HookFetchAssetAllowanceQK = (
  asset: Address,
  spender: Address,
  userAddress: Address,
  config: any,
  queryClient: any
) =>
  [
    "hookFetchAllowance",
    asset,
    spender,
    userAddress,
    config,
    queryClient,
  ] as const;

/**
 * Custom hook for fetching asset allowance.
 *
 * @param {Address} asset - The address of the ERC20 token contract.
 * @param {Address} spender - The address of the spender to check allowance for.
 */
export const useFetchAssetAllowance = ({
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
    queryKey: HookFetchAssetAllowanceQK(
      asset!,
      spender!,
      userAddress!,
      config,
      queryClient
    ),
    queryFn: () =>
      fetchAllowance(asset!, spender!, userAddress!, queryClient, config),
    enabled: !!asset && !!spender && !!userAddress,
    ...queryConfig.sensitiveDataQueryConfig,
  });

  return {
    ...rest,
    data,
    queryKey: HookFetchAssetAllowanceQK(
      asset!,
      spender!,
      userAddress!,
      config,
      queryClient
    ),
  };
};
