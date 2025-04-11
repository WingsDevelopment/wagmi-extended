# wagmi-extended

`wagmi-extended` is a powerful library that builds on [Wagmi](https://wagmi.sh/), [Viem](https://viem.sh/), and [TanStack Query](https://tanstack.com/query/v5) to deliver extended hooks and helper functions for Ethereum and blockchain development with React.
<br /><br />
It simplifies tasks like fetching token metadata, handling ERC20 approvals, sending transactions, writing contracts and getting user friendly error message.
<br /><br />
Our library adheres to one core principle: **always wait for a transaction receipt**. This guarantees that your dApps capture transaction outcomes reliably—no manual state management or race conditions required.
<br /><br />
Whether you're building a DeFi platform, a governance system, or any blockchain solution, `wagmi-extended` offers a consistent, reliable, and developer-friendly interface, trusted in production with over $500M in volume.

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

- **React**: ^17.0.0 || ^18.0.0
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
} from "wagmi-extended";
```

Each hook is documented with detailed JSDoc comments (including usage examples) in the source code. Refer to that documentation for additional details.

## Hooks explanations and examples

### useERC20ApproveX Hook

The `useERC20ApproveX` hook simplifies ERC20 token approvals by checking the allowance and handling the transaction to approve transfers.

Example:

```bash
import { useERC20ApproveX } from "wagmi-extended";

function ApproveButton(amountToApprove: number) {
  const tokenAddress = "0xTokenAddress";      // Replace with your token address
  const spenderAddress = "0xSpenderAddress";  // Replace with the spender address

  const { isApproved, isApproving, approveAsync } = useERC20ApproveX(
    tokenAddress,
    spenderAddress,
    parseUnits(amountToApprove.toString(), 18),
  );

  return (
    <button onClick={approveAsync} disabled={isApproving || isApproved}>
      {isApproving ? "Approving..." : isApproved ? "Approved" : "Approve Token"}
    </button>
  );
}
```

### useContractWriteX hook

The `useContractWriteX` hook wraps the contract-writing functionality from Wagmi with additional features like `receipt` waiting, `logging` control, and `query invalidation` after receipt is successfully fetched.

Example:

```bash
function MyTransactionComponent() {
const { writeContractAsync, isPending, errorMessage } = useContractWriteX({
    queriesToInvalidate: [["userBalance"], ["userActivity"]],
});

const handleWrite = async () => {
    try {
      const txHash = await writeContractAsync({
        address: "0xContractAddress",
        abi: [], // Provide your contract ABI
        functionName: "executeFunction",
        args: [/* function arguments */],
      }, {
        // use calbacks here in writeContractAsync or in useContractWriteX
        onSuccess: (txHash) => console.log("Transaction successful:", txHash),
        onError: (error) => console.error("Transaction error:", error),
      });
      console.log("Received txHash:", txHash);
    } catch (err) {
      console.error("Failed writing transaction:", err);`
    }
};

return (
    <div>
    <button onClick={handleWrite} disabled={isPending}>
        {isPending ? "Processing..." : "Write Transaction"}
    </button>
    {errorMessage && <p>Error: {errorMessage}</p>}
    </div>
);
}
```

### useSendTransactionX Hook

The `useSendTransactionX` hook wraps the transaction-sending functionality from Wagmi with additional features like `receipt` waiting, `logging` control, and `query invalidation` after receipt is successfully fetched.

Very similar to useContractWrite, see [playground](https://codesandbox.io/p/sandbox/5jr3lg) for example.

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

> **Note:** : if you did not setup defaults (queryClient and wagmi config) you can call by passing client and config as params: `fetchTokenX(token, queryClient, wagmiConfig)`.

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

## License

This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or distribute this software, either in source code form or as a compiled binary, for any purpose, commercial or non-commercial, and by any means.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org/>
