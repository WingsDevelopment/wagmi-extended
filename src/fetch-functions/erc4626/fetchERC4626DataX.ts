import { QueryClient } from "@tanstack/react-query";
import { Address } from "viem";
import { Config } from "wagmi";
import { ensureClientAndConfig } from "../../utils/ensureClientAndConfig.js";
import { fetchERC4626AssetX } from "./fetchERC4626AssetX.js";
import { fetchERC4626MaxDepositX } from "./fetchERC4626MaxDepositX.js";
import { fetchERC4626TotalAssetsX } from "./fetchERC4626TotalAssetsX.js";
import { fetchERC4626MaxMintX } from "./fetchERC4626MaxMintX.js";
import { fetchERC4626MaxRedeemX } from "./fetchERC4626MaxRedeemX.js";
import { fetchERC4626MaxWithdrawX } from "./fetchERC4626MaxWithdrawX.js";
import { fetchERC20DataX } from "../erc20/fetchERC20DataX.js";

/**
 * Fetches the full ERC-4626 “summary” for a given vault and user context.
 */
export async function fetchERC4626DataX(
  vault: Address,
  user?: Address,
  spender?: Address,
  queryClient?: QueryClient,
  wagmiConfig?: Config
) {
  ({ queryClient, wagmiConfig } = ensureClientAndConfig(
    queryClient,
    wagmiConfig
  ));

  const [erc20Data, maxDeposit, maxMint, maxRedeem, maxWithdraw] =
    await Promise.all([
      fetchERC20DataX(vault, user, spender, queryClient, wagmiConfig),

      fetchERC4626AssetX(vault, queryClient, wagmiConfig),
      fetchERC4626TotalAssetsX(vault, queryClient, wagmiConfig),
      user
        ? fetchERC4626MaxDepositX(vault, user, queryClient, wagmiConfig)
        : undefined,
      user
        ? fetchERC4626MaxMintX(vault, user, queryClient, wagmiConfig)
        : undefined,
      user
        ? fetchERC4626MaxRedeemX(vault, user, queryClient, wagmiConfig)
        : undefined,
      user
        ? fetchERC4626MaxWithdrawX(vault, user, queryClient, wagmiConfig)
        : undefined,
    ]);

  return {
    ...erc20Data,
    maxDeposit,
    maxMint,
    maxRedeem,
    maxWithdraw,
    vault,
    owner: user,
    spender,
  };
}

export type ERC4626DataX = Awaited<ReturnType<typeof fetchERC4626DataX>>;
