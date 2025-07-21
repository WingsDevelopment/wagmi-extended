import { useState, useEffect } from "react";
import { Address, maxUint256, erc20Abi } from "viem";
import { useFetchAssetAllowanceX } from "../queries/useFetchAssetAllowanceX.js";
import { useContractWriteX } from "./useContractWriteX.js";

/**
 * Custom hook for approving ERC20 token transfers.
 *
 * This hook provides functionality for approving ERC20 token transfers, checking the current allowance, and handling the approval transaction using Wagmi.
 *
 * @param {Address} tokenAddress - The address of the ERC20 token contract (the transfer from).
 * @param {Address} spenderAddress - The address of the spender to approve the transfer to.
 * @param {bigint} [amount=BigInt(0)] - The amount to approve for transfer. Defaults to undefined.
 * @param {boolean} [approveMax=false] - Indicates whether to approve the maximum amount or a specific amount.
 * @returns {Object} Object containing the following properties:
 * - {boolean} isApproved - Indicates whether the spender is already approved to transfer the specified amount of tokens.
 * - {boolean} isApproving - Indicates whether an approval transaction is currently pending.
 * - {Function} approveAsync - Function to trigger the approval transaction.
 *
 * @example
 * // In your component:
 * function ApproveTokenButton(amountToApprove) {
 *   const tokenAddress = "0xTokenAddressExample";
 *   const spenderAddress = "0xSpenderAddressExample";
 *
 *   const { isApproved, isApproving, justApproved, approveAsync } = useERC20ApproveX(
 *     tokenAddress,
 *     spenderAddress,
 *     parseUnits(amountToApprove.toString(), 18),
 *   );
 *
 *   return (
 *     <button onClick={approveAsync} disabled={isApproving || isApproved}>
 *       {isApproving ? "Approving..." : isApproved ? "Approved" : "Approve Token"}
 *     </button>
 *   );
 * }
 */

export const useERC20ApproveX = (
  tokenAddress?: Address,
  spenderAddress?: Address,
  amount?: bigint,
  approveMax?: boolean
) => {
  const [isApproved, setIsApproved] = useState(false);
  const [justApproved, setJustApproved] = useState(false);

  const { data: allowance, queryKey: allowanceKQ } = useFetchAssetAllowanceX({
    asset: tokenAddress,
    spender: spenderAddress,
  });

  const { writeContractAsync: approveTokenAsync, isPending } =
    useContractWriteX({
      queriesToInvalidate: [allowanceKQ],
      onSuccess: () => {
        setJustApproved(true);
      },
    });

  useEffect(() => {
    if (amount == null) {
      setIsApproved(false);
    } else if (allowance && allowance >= amount) {
      setIsApproved(true);
    } else {
      setIsApproved(false);
    }
  }, [allowance, amount]);

  const approveAsync = async () => {
    const amountToApprove = approveMax ? maxUint256 : amount;

    try {
      if (!spenderAddress) {
        throw new Error("spenderAddress is undefined!");
      }
      if (!tokenAddress) {
        throw new Error("tokenAddress is undefined!");
      }
      if (amountToApprove == null) {
        throw new Error("amountToApprove is undefined!");
      }

      await approveTokenAsync({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [spenderAddress, amountToApprove],
      });
    } catch (e: any) {
      console.error("Error approving token:", e);
      throw e;
    }
  };

  return {
    isApproved,
    isApproving: isPending,
    justApproved,
    approveAsync,
  };
};
