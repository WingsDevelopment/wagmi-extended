import { QueryClient } from "@tanstack/react-query"
import { Config } from "wagmi"

let defaultQueryClient: QueryClient | null = null
let defaultWagmiConfig: any = null

/**
 * Sets the default configuration values.
 *
 * @param queryClient - The default QueryClient instance.
 * @param wagmiConfig - The default Wagmi configuration.
 * @example
 * //In your application initialization (e.g., index.tsx or App.tsx):
 * import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
 * import { wagmiConfig } from "/path/to/wagmi-config";
 * import { setDefaults } from "wagmi-extended";
 *
 * const queryClient = new QueryClient();
 *
 * //Set defaults for the extended library functions.
 * setDefaults(queryClient, wagmiConfig);
 *
 * //Now helper functions like fetchTokenX can use these defaults if no explicit parameters are provided.
 */
export function setDefaults(queryClient: QueryClient, wagmiConfig: Config): void {
  defaultQueryClient = queryClient
  defaultWagmiConfig = wagmiConfig
}

/**
 * Retrieves the currently set default configurations.
 *
 * @throws Will throw an error if defaults are not initialized.
 * @returns An object containing the default queryClient and wagmiConfig.
 *
 * @example
 * // Usage in a helper function:
 * import { getDefaults } from "wagmi-extended";
 *
 * function exampleFunction() {
 *   const { queryClient, wagmiConfig } = getDefaults();
 *   // Use queryClient and wagmiConfig as needed...
 * }
 */
export function getDefaults(): {
  queryClient: QueryClient
  wagmiConfig: Config
} {
  if (!defaultQueryClient || !defaultWagmiConfig) {
    throw new Error("Default configuration not set. Please call setDefaults() first.")
  }
  return { queryClient: defaultQueryClient, wagmiConfig: defaultWagmiConfig }
}
