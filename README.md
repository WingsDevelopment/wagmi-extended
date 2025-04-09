# wagmi-extended

`wagmi-extended` is a library that provides extended hooks and helper functions on top of [Wagmi](https://wagmi.sh/), [Viem](https://viem.sh/), and [TanStack Query](https://tanstack.com/query/v5) for Ethereum and blockchain development with React. It simplifies common tasks such as fetching token metadata, approving ERC20 token transfers, sending transactions, writing contracts, waiting for receipt and more—with configurable behavior via global defaults.

## Table of Contents

- [Installation](#installation)
- [Requirements](#requirements)
- [API](#api)
- [Setup](#setup)
- [Usage](#usage)
  - [useERC20ApproveX Hook](#useerc20approvex-hook)
  - [useContractWriteX Hook](#usecontractwritex-hook)
  - [useSendTransactionX Hook](#usesendtransactionx-hook)
  - [useTokenX Hook](#usetokenx-hook)
- [License](#license)

### Installation

Install via npm:

```bash
npm install wagmi-extended
```

Or with Yarn:

```bash
yarn add wagmi-extended
```

### Requirements

Your project must include the following peer dependencies:

- **React**: ^17.0.0 || ^18.0.0
- **Wagmi**: ^2.0.0
- **Viem**: ^2.0.0
- **@tanstack/react-query**: ^5.0.0

Note: You must wrap your application with necessary providers (e.g. QueryClientProvider from TanStack Query).

### API

You can import all the functions and hooks directly from `wagmi-extended`. For example:

```bash
import {
  useTokenX,
  useERC20ApproveX,
  useSendTransactionX,
  setDefaults,
  getDefaults,
} from "wagmi-extended";
```

Each hook is documented with detailed JSDoc comments (including usage examples) in the source code. Refer to that documentation for additional details.

## Setup

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

const queryClient = new QueryClient();
// Obtain your Wagmi configuration from your initialization or provider
const wagmiConfig = /* your wagmi config here */;

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
    onSuccess: (txHash) => console.log("Transaction successful:", txHash),
    onError: (error) => console.error("Transaction error:", error),
    queriesToInvalidate: [["userBalance"], ["userActivity"]],
});

const handleWrite = async () => {
    try {
    const txHash = await writeContractAsync({ transaction params here.. });
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

Example:

```bash
import { useSendTransactionX } from "wagmi-extended";

function TransactionButton() {
  const { sendTransactionAsync, isPending, errorMessage } = useSendTransactionX({
    onSuccess: (txHash) => console.log("Transaction successful:", txHash),
    onError: (error) => console.error("Transaction failed:", error),
    queriesToInvalidate: [["someQueryKey"]],
  });

  const handleTransaction = async () => {
    try {
      // Replace with actual transaction parameters
      const txHash = await sendTransactionAsync({
        address: "0xContractAddress",
        abi: [], // Provide your contract ABI
        functionName: "executeFunction",
        args: [/* function arguments */],
      });
      console.log("Transaction hash:", txHash);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <button onClick={handleTransaction} disabled={isPending}>
      {isPending ? "Processing..." : "Send Transaction"}
      {errorMessage && <span>Error: {errorMessage}</span>}
    </button>
  );
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

### License

This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or distribute this software, either in source code form or as a compiled binary, for any purpose, commercial or non-commercial, and by any means.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org/>
