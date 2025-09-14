# wagmi-extended

`wagmi-extended` is a powerful library that builds on [Wagmi](https://wagmi.sh/), [Viem](https://viem.sh/), and [TanStack Query](https://tanstack.com/query/v5) to deliver extended hooks and helper functions for Ethereum and blockchain development with React.
<br /><br />
It simplifies tasks like fetching token metadata, handling ERC20 approvals, sending transactions, writing contracts and getting user friendly error message from ABIs.
<br /><br />
Our library adheres to one core principle: **always wait for a transaction receipt**. This guarantees that your dApps capture transaction outcomes reliably—no manual state management or race conditions required.
<br /><br />
Whether you're building a DeFi platform, a governance system, or any blockchain solution, `wagmi-extended` offers a consistent, reliable, and developer-friendly interface, trusted in production with over $500M in volume.

> **Note:** This project is **actively maintained**. The creator can be reached directly on [Discord](https://discord.gg/XQYzXgq2Ve). We are open to **suggestions and requests**, and love feedback from the community.

## Table of Contents

- [Installation](#installation)
- [Requirements](#requirements)
- [Playground](#playground)
- [API](#api)
- [Usage](#usage)
  - [useERC20ApproveX Hook](#useerc20approvex-hook)
  - [useContractWriteX Hook](#usecontractwritex-hook)
  - [useSendTransactionX Hook](#usesendtransactionx-hook)
  - [useTokenX Hook](#usetokenx-hook)
- [Non-hook functions setup](#non-hook-functions-setup)
  - [Error handling](#error-handling)
  - [fetchTokenX](#fetchTokenX)
  - [fetchDeploymentBlockX](#fetchDeploymentBlockX)
- [Contributing](#contributing)
- [Donations](#support--donations)
- [License](#license)

## Installation

Install via npm:

```bash
npm install wagmi-extended
```

Or with Yarn:

```bash
yarn add wagmi-extended
```

## Requirements

Your project must include the following peer dependencies:

- **React**: ^17.0.0 || ^18.0.0 || ^19.0.0
- **Wagmi**: ^2.0.0
- **Viem**: ^2.0.0
- **@tanstack/react-query**: ^5.0.0

> **Note:** : You must wrap your application with necessary providers (e.g. QueryClientProvider from TanStack Query and WagmiProvider).

## Playground

Compare wagmi-extended with standard wagmi implementations in our interactive CodeSandbox project. [View the CodeSandbox Project](https://codesandbox.io/p/sandbox/5jr3lg) to explore its features and see how it works in practice!

### API

You can import all the functions and hooks directly from `wagmi-extended`. For example:

```bash
import {
  useTokenX,
  useERC20ApproveX,
  useSendTransactionX,
  useWriteTransactionX,
  setDefaults,
  getDefaults,
  WriteExtendedAsyncParams
} from "wagmi-extended";
```

Each hook is documented with detailed JSDoc comments (including usage examples) in the source code. Refer to that documentation for additional details.

## Hooks explanations and examples

### useContractWriteX Hook

The `useContractWriteX` hook wraps Wagmi’s `useWriteContract` with extra features:

- **Receipt waiting**: always waits for the transaction receipt before resolving.
- **Logging control**: disable console logging if you wish.
- **Query invalidation**: automatically invalidates queries after receipt, either by explicit keys or by predicate.

#### Original `writeContractAsync`

```ts
const { writeContractAsync, isPending, errorMessage } = useContractWriteX({
  queriesToInvalidate: [["userBalance"], ["userActivity"]],
  onSuccess: (txHash) => console.log("✅", txHash),
  onError: (err) => console.error("❌", err),
})

// will wait for the receipt, then invalidate `userBalance` & `userActivity`
await writeContractAsync({
  address: "0xContractAddress",
  abi: MyContractAbi,
  functionName: "executeFunction",
  args: [
    /* ... */
  ],
})
```

#### New `writeContractX` method

Use `writeContractX` if you need control over the simulation step:

```ts
const { writeContractX, isPending, errorMessage } = useContractWriteX({
  onSuccess: (tx) => console.log("✔ Receipt confirmed:", tx),
  onError: (e) => console.error("✖ Failed:", e),
})

// simulate + send:
await writeContractX(
  {
    address: "0xContractAddress",
    abi: MyContractAbi,
    functionName: "executeFunction",
    args: [
      /* ... */
    ],
    account: myAddress,
    chain: myChain,
    value: 0n,
  },
  /* disableSimulation? */ false
)

// send immediately without simulation:
await writeContractX(params, /* disableSimulation= */ true)
```

- **`writeContractAsync`** = always runs the built-in dry-run, then write.
- **`writeContractX`** = you can pass a boolean to skip the simulation step.
- **`writeContract`** = or use writeContract to skip the simulation step. (still will wait for transaction recepit and invalidate query)

---

### useSendTransactionX Hook

The `useSendTransactionX` hook wraps Wagmi’s `useSendTransaction` with the same lifecycle features:

- **`sendTransaction`** = Wagmi’s raw send
- **`sendTransactionX`** = optionally simulate (contract call) or just `eth_call`, then `sendTransaction` + receipt waiting + invalidations.

```ts
const {
  sendTransaction, // raw
  sendTransactionX, // wrapped
  isPending,
  errorMessage,
} = useSendTransactionX({
  queriesToInvalidate: [["ethBalance"]],
  onSuccess: (tx) => console.log("🎉 Tx sent & confirmed:", tx),
  onError: (e) => console.error("🚫 Simulation or send failed:", e),
})

// simulate & send an ETH transfer:
await sendTransactionX(
  { to: recipient, value: 1n * 10n ** 18n, account: myAddress, chain: myChain },
  // for contract calls, pass simulation params:
  { abi: MyAbi, functionName: "deposit", args: [1000n], chain: myChain }
)

// or just raw send (no simulationParams):
await sendTransactionX({ to, value, account })
```

---

## Transaction mutation settings

In all “X” hooks you pass a `WriteExtendedAsyncParams` object:

```ts
export type WriteExtendedAsyncParams = {
  onSuccess?: (txHash: Address) => void
  onError?: (e: any) => void
  onSettled?: () => void
  onSuccessAsync?: (txHash: Address) => Promise<void>
  onErrorAsync?: (e: any) => Promise<void>
  onSettledAsync?: () => Promise<void>

  /** simple list of query keys to invalidate after receipt */
  queriesToInvalidate?: (QueryKey | undefined)[]

  /** predicate-based invalidation:
      any active query where `predicate(query)` returns true
      will be invalidated after the tx settles. */
  invalidatePredicate?: (query: Query<unknown, unknown>) => boolean

  disableLogging?: boolean
  disableWaitingForReceipt?: boolean
}
```

---

### useFetchERC4626DataX Hook

Fetch summary data from an ERC-4626 vault (total assets, shares, allowances, balances, etc.):

```ts
import { useFetchERC4626DataX } from "wagmi-extended"

function VaultInfo({ vaultAddress, user, spender }) {
  const { data, isLoading, error } = useFetchERC4626DataX({
    vault,
    user,
    spender,
  })

  if (isLoading) return <p>Loading vault data…</p>
  if (error) return <p>Error: {error.message}</p>

  return (
    <div>
      <p>Total assets: {data.totalAssets}</p>
      <p>Current shares: {data.shares}</p>
      <p>Your balance: {data.userBalance}</p>
      <p>Your allowance: {data.allowance}</p>
    </div>
  )
}
```

---

### useFetchERC20DataX Hook

Fetch summary data for a generic ERC-20 token (decimals, name, symbol, balances, allowances):

```ts
import { useFetchERC20DataX } from "wagmi-extended"

function TokenInfo({ token, user, spender }) {
  const { data, isLoading, error } = useFetchERC20DataX({
    address: token,
    user,
    spender,
  })

  if (isLoading) return <p>Loading token info…</p>
  if (error) return <p>Error: {error.message}</p>

  return (
    <div>
      <p>Name: {data.name}</p>
      <p>Symbol: {data.symbol}</p>
      <p>Decimals: {data.decimals}</p>
      <p>Your balance: {data.balance}</p>
      <p>Your allowance: {data.allowance}</p>
    </div>
  )
}
```

### useTokenX Hook

The useTokenX hook fetches token metadata (symbol, decimals, name and symbol) for a given token address using React Query and your Wagmi configuration.

```bash
import { useTokenX } from "wagmi-extended";
import { Address } from "viem";

function TokenDisplay({ tokenAddress }: { tokenAddress: Address }) {
  const { data, isLoading, error } = useTokenX(tokenAddress);

  if (isLoading) return <div>Loading token data...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <p>Symbol: {data.symbol}</p>
      <p>Decimals: {data.decimals}</p>
      <p>Name: {data.name}</p>
    </div>
  );
}
```

## Non-hook functions setup

**Feel free to skip Setup-section if using only hooks - no fetch methods directly**
<br />
For easier use of fetch (non hook) functions setup the default configuration.
<br />
This is done by calling `setDefaults` in your application initialization (e.g., in index.tsx or App.tsx).

Example:

```bash
// index.tsx (or App.tsx)
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useConfig } from "wagmi";
import { setDefaults } from "wagmi-extended";
import { wagmiConfig } from "/your/path/to/wagmi-config";

const queryClient = new QueryClient();
// Obtain your Wagmi configuration from your initialization or provider

// Set defaults for the extended library functions.
setDefaults(queryClient, wagmiConfig);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
```

### Error Handling

The library provides a built-in error mapping mechanism to transform raw errors into user-friendly messages. This is especially useful when working with smart contracts that may revert with different kinds of errors.

> **Note:** : mapper is just a `fallback` if error message can't be understood from ABIs.

Example: Override the default allowance error message and add a new custom error. Provide error type (name), signature or reason and string as a message.

```bash
setErrorMapping({
  ErrorNotEnoughAllowance: "Custom message: Please approve tokens first!",
  NewCustomError: "A custom error occurred.",
  "0xea8d7f02":
    "Action exceeded safe slippage parameters, please try again later",
});
```

> **Note:** : this `EXPANDS` the current object, it doesn't override.

This is default error mapper, feel free to create PR to extend it as well:

```bash
const defaultErrorMapping: Record<string, string> = {
  EnforcedPause: "Temporary pause in effect, please check Discord for updates.",
  ErrorNotEnoughAllowance:
    "Not enough allowance, did you approve your tokens first?",
  "0xc2139725": "Not enough allowance, did you approve your tokens first?",
  SharesReceivedBelowMinimum:
    "Action exceeded safe slippage parameters, please try again later",
  "0xea8d7f02":
    "Action exceeded safe slippage parameters, please try again later",
  MaxSlippageExceeded:
    "Action exceeded safe slippage parameters, please try again later",
  "51": "Supply cap exceeded",
};
```

> **Note:** : if you don't like initial error mapping and messages, you can call `resetErrorMapping()` which will reset the mapping to `{}`.

### fetchTokenX

Example:

```bash
const tokensData = await Promise.all(tokenAddresses.map((token) =>
  fetchTokenX(token);
));
```

> **Note:** : if you did not setup configs (queryClient and wagmi config) you can call by passing client and config as params: `fetchTokenX(token, queryClient, wagmiConfig)`.

### fetchDeploymentBlockX

The `fetchDeploymentBlockX` function finds and caches the earliest block where a contract was deployed  
(i.e., the first block containing bytecode at a given address).

It uses an **exponential descent** followed by a **binary search**, making it optimal for locating deployment blocks with minimal RPC calls.

- **Exponential descent**: quickly finds a safe lower bound with no code.
- **Binary search**: efficiently pinpoints the exact deployment block in logarithmic steps.

#### Features

- **React Query caching**: results stored under the key  
  `["deploymentBlock", chainId, address.toLowerCase(), floor]`.
- **LocalStorage caching (browser only)**:
  - On the **first run**, the block is computed and stored in both React Query and `localStorage`.
  - On **subsequent runs**, the value is read from `localStorage` to fully prevent RPC refetches.
- **SSR-safe**: all localStorage access is gated by `typeof window !== 'undefined'`.
- **Opt-out**: pass `{ disableLocalStorage: true }` to bypass read/write of `localStorage`.

#### Example

```ts
import { fetchDeploymentBlockX } from "wagmi-extended"

async function main() {
  const deploymentBlock = await fetchDeploymentBlockX("0xYourContractAddress", 0n)

  console.log("Contract was deployed at block:", deploymentBlock.toString())
}

main()
```

Performance

Performs O(log N) RPC calls, where N is the distance between the latest block and the deployment block.

- Much more efficient than linear scanning.
- Automatically cached by React Query under the key:

## Contributing

This project is open source and we welcome contributions from the community! If you have ideas, improvements, or bug fixes, please feel free to open pull requests or file issues. Your help makes this project better for everyone.

- **Open Issues & PRs:**
  You can report bugs or request features by opening an issue on [GitHub Issues](https://github.com/WingsDevelopment/wagmi-extended/issues). Similarly, feel free to open a pull request (PR) with your changes.

- **Star the Project:**
  If you like `wagmi-extended` or find it useful, please consider starring the repository on [GitHub](https://github.com/WingsDevelopment/wagmi-extended). It helps the project gain visibility and motivates further development.

Thank you for your support and contributions!

## Support & Donations

If you enjoy this project and would like to support its ongoing development, please consider donating!

- **Buy Me a Coffee:**
  [buymeacoffee.com/srdjanr160N](https://buymeacoffee.com/srdjanr160N)

- **Ethereum Donation Address:**
  `0x410A11ed53a9a59094F24D2ae4ACbeF7f84955a1`

Any donation, no matter how small, is greatly appreciated!

## Community

- **X (Twitter):** Follow and share updates with the hashtag [#wagmiExtended](https://x.com/hashtag/wagmiExtended). Use it to discover tips, release notes, and community projects.
- **Discord:** Join the community and reach the creator directly at [discord.gg/XQYzXgq2Ve](https://discord.gg/XQYzXgq2Ve).

## License

This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or distribute this software, either in source code form or as a compiled binary, for any purpose, commercial or non-commercial, and by any means.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org/>

```

```
