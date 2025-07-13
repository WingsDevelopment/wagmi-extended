import { QueryClient } from "@tanstack/react-query";
import { Address, erc20Abi } from "viem";
import { Config } from "wagmi";
import { readContractQueryOptions } from "wagmi/query";
import { queryConfig } from "../../query-config/index.js";
import { ensureClientAndConfig } from "../../utils/ensureClientAndConfig.js";

export async function fetchNameX(
  asset: Address,
  queryClient?: QueryClient,
  wagmiConfig?: Config
): Promise<string | undefined> {
  ({ queryClient, wagmiConfig } = ensureClientAndConfig(
    queryClient,
    wagmiConfig
  ));

  return await queryClient.fetchQuery({
    ...readContractQueryOptions(wagmiConfig, {
      address: asset,
      abi: erc20Abi,
      functionName: "name",
    }),
    ...queryConfig.metaDataQuery,
  });
}
