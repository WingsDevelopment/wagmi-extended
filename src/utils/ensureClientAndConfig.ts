import { QueryClient } from "@tanstack/react-query";
import { Config } from "wagmi";
import { getDefaults } from "../config/defaults.js";

export function ensureClientAndConfig(
  queryClient?: QueryClient,
  wagmiConfig?: Config
): { queryClient: QueryClient; wagmiConfig: Config } {
  if (!queryClient || !wagmiConfig) {
    ({ queryClient, wagmiConfig } = getDefaults());
  }
  if (!queryClient || !wagmiConfig) {
    throw new Error(
      "Could not find queryClient or wagmiConfig; pass them in or setDefaults() first"
    );
  }
  return { queryClient, wagmiConfig };
}
