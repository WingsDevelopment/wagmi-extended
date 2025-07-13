import { Address, erc20Abi } from "viem";
import type { Config } from "wagmi";
import type { QueryClient } from "@tanstack/react-query";
import { readContractQueryOptions } from "wagmi/query";
import { queryConfig } from "../../query-config/index.js";
import { ensureClientAndConfig } from "../../utils/ensureClientAndConfig.js";

export async function fetchAllowanceX(
  asset: Address,
  spender: Address,
  user: Address,
  queryClient?: QueryClient,
  wagmiConfig?: Config
) {
  ({ queryClient, wagmiConfig } = ensureClientAndConfig(
    queryClient,
    wagmiConfig
  ));

  const allowance = await queryClient.fetchQuery({
    ...readContractQueryOptions(wagmiConfig, {
      address: asset,
      abi: erc20Abi,
      functionName: "allowance",
      args: [user, spender],
    }),
    ...queryConfig.metaDataQuery,
  });

  return allowance;
}
