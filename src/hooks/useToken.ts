import { useQuery, useQueryClient } from "@tanstack/react-query";
import { readContractQueryOptions } from "wagmi/query";
import { Address, zeroAddress, erc20Abi } from "viem";
import { queryConfig } from "../query-config/index.js";
import { useConfig } from "wagmi";

export interface Token {
  symbol: string;
  decimals: number;
  name: string;
}

export const EthTokenData: Token = {
  symbol: "ETH",
  decimals: 18,
  name: "Ethereum",
};

export async function fetchDecimals(
  token: Address,
  queryClient: any,
  wagmiConfig: any
): Promise<number | undefined> {
  if (token === zeroAddress) return EthTokenData.decimals;

  const decimals = await queryClient.fetchQuery({
    ...readContractQueryOptions(wagmiConfig, {
      address: token,
      abi: erc20Abi,
      functionName: "decimals",
    }),
    ...queryConfig.metadataQueryConfig,
  });

  return decimals;
}

export async function fetchSymbol(
  token: Address,
  queryClient: any,
  wagmiConfig: any
): Promise<string> {
  if (token === zeroAddress) return EthTokenData.symbol;

  const symbol = await queryClient.fetchQuery({
    ...readContractQueryOptions(wagmiConfig, {
      address: token,
      abi: erc20Abi,
      functionName: "symbol",
    }),
    ...queryConfig.metadataQueryConfig,
  });

  return symbol;
}

export async function fetchName(
  token: Address,
  queryClient: any,
  wagmiConfig: any
): Promise<string> {
  if (token === zeroAddress) return EthTokenData.name;

  const name = await queryClient.fetchQuery({
    ...readContractQueryOptions(wagmiConfig, {
      address: token,
      abi: erc20Abi,
      functionName: "name",
    }),
    ...queryConfig.metadataQueryConfig,
  });

  return name;
}

/**
 * Fetches the token metadata (symbol, decimals) for the given token address.
 * Internally calls:
 *  - `fetchSymbol(token)`   to retrieve the token symbol,
 *  - `fetchDecimals(token)` to retrieve the token decimals
 *  - `fetchName(token)`     to retrieve the token name
 *
 * @param token - The address of the token.
 * @returns A `Token` object containing the symbol, decimals.
 * @throws Will throw an error if symbol or decimals cannot be fetched.
 */
export async function fetchToken(
  token: Address,
  queryClient: any,
  wagmiConfig: any
): Promise<Token> {
  const [symbol, decimals, name] = await Promise.all([
    fetchSymbol(token, queryClient, wagmiConfig),
    fetchDecimals(token, queryClient, wagmiConfig),
    fetchName(token, queryClient, wagmiConfig),
  ]);
  if (!symbol || !decimals) {
    throw new Error("Failed to fetch token data");
  }

  return {
    symbol,
    decimals,
    name,
  };
}

export const useToken = (asset?: Address) => {
  const queryClient = useQueryClient();
  const config = useConfig();

  const { data, ...rest } = useQuery({
    queryKey: ["useTokenWagmiExtended", asset],
    queryFn: () => fetchToken(asset!, queryClient, config),
    enabled: Boolean(asset),
  });

  return {
    ...rest,
    data,
  };
};
