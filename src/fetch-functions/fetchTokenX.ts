import { QueryClient } from "@tanstack/react-query";
import { readContractQueryOptions } from "wagmi/query";
import { Address, zeroAddress, erc20Abi } from "viem";
import { Config } from "wagmi";
import { getDefaults } from "../config/defaults.js";
import { queryConfig } from "../query-config/index.js";

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

export async function fetchDecimalsX(
  token: Address,
  queryClient?: QueryClient,
  wagmiConfig?: Config
): Promise<number | undefined> {
  if (!queryClient || !wagmiConfig) {
    ({ queryClient, wagmiConfig } = getDefaults());
  }
  if (!queryClient || !wagmiConfig) {
    throw new Error(
      "Could not find queryClient or wagmiConfig, either pass them as arguments or set them using setDefaults()"
    );
  }

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

export async function fetchSymbolX(
  token: Address,
  queryClient?: QueryClient,
  wagmiConfig?: Config
): Promise<string> {
  if (!queryClient || !wagmiConfig) {
    ({ queryClient, wagmiConfig } = getDefaults());
  }
  if (!queryClient || !wagmiConfig) {
    throw new Error(
      "Could not find queryClient or wagmiConfig, either pass them as arguments or set them using setDefaults()"
    );
  }

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

export async function fetchNameX(
  token: Address,
  queryClient: any,
  wagmiConfig: any
): Promise<string> {
  if (token === zeroAddress) return EthTokenData.name;

  if (!queryClient || !wagmiConfig) {
    ({ queryClient, wagmiConfig } = getDefaults());
  }
  if (!queryClient || !wagmiConfig) {
    throw new Error(
      "Could not find queryClient or wagmiConfig, either pass them as arguments or set them using setDefaults()"
    );
  }

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
export async function fetchTokenX(
  token: Address,
  queryClient: any,
  wagmiConfig: any
): Promise<Token> {
  const [symbol, decimals, name] = await Promise.all([
    fetchSymbolX(token, queryClient, wagmiConfig),
    fetchDecimalsX(token, queryClient, wagmiConfig),
    fetchNameX(token, queryClient, wagmiConfig),
  ]);
  if (!symbol || !decimals || !name) {
    throw new Error("Failed to fetch token data");
  }

  return {
    symbol,
    decimals,
    name,
  };
}
