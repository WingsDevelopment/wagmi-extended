import { QueryClient } from "@tanstack/react-query";
import { Address, erc4626Abi } from "viem";
import { Config } from "wagmi";
import { readContractQueryOptions } from "wagmi/query";
import { queryConfig } from "../../query-config/index.js";
import { ensureClientAndConfig } from "../../utils/ensureClientAndConfig.js";

export async function fetchERC4626ConvertToAssetsX(
  vault: Address,
  shares: bigint,
  queryClient?: QueryClient,
  wagmiConfig?: Config
): Promise<bigint> {
  ({ queryClient, wagmiConfig } = ensureClientAndConfig(
    queryClient,
    wagmiConfig
  ));
  return queryClient.fetchQuery({
    ...readContractQueryOptions(wagmiConfig, {
      address: vault,
      abi: erc4626Abi,
      functionName: "convertToAssets",
      args: [shares],
    }),
    ...queryConfig.semiSensitiveQuery,
  });
}
