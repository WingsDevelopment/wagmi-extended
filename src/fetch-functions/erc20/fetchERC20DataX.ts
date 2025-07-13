import { QueryClient } from "@tanstack/react-query";
import { Address } from "viem";
import { Config } from "wagmi";
import { ensureClientAndConfig } from "../../utils/ensureClientAndConfig.js";
import { fetchAllowanceX } from "./fetchAllowanceX.js";
import { fetchBalanceOfX } from "./fetchBalanceOfX.js";
import { fetchTotalSupplyX } from "./fetchTotalSupplyX.js";
import { fetchNameX, fetchSymbolX, fetchDecimalsX } from "../fetchTokenX.js";

/**
 * Fetches the full ERC-20 “summary” for a given vault and user context.
 */
export async function fetchERC20DataX(
  address: Address,
  user?: Address,
  spender?: Address,
  queryClient?: QueryClient,
  wagmiConfig?: Config
) {
  ({ queryClient, wagmiConfig } = ensureClientAndConfig(
    queryClient,
    wagmiConfig
  ));

  const [name, symbol, decimals, allowance, balanceOf, asset] =
    await Promise.all([
      fetchNameX(address, queryClient, wagmiConfig),
      fetchSymbolX(address, queryClient, wagmiConfig),
      fetchDecimalsX(address, queryClient, wagmiConfig),
      spender && user
        ? fetchAllowanceX(address, spender, user, queryClient, wagmiConfig)
        : undefined,
      user
        ? fetchBalanceOfX(address, user, queryClient, wagmiConfig)
        : undefined,
      fetchTotalSupplyX(address, queryClient, wagmiConfig),
    ]);

  return {
    name,
    symbol,
    decimals,
    allowance,
    balanceOf,
    asset,
    address,
    user,
    spender,
  };
}

export type ERC20DataX = Awaited<ReturnType<typeof fetchERC20DataX>>;
