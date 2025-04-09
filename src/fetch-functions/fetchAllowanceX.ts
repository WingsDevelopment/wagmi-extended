import { Address, erc20Abi } from "viem";
import { readContract } from "viem/actions";

export const fetchAllowance = async (
  asset: Address,
  spender: Address,
  userAddress: Address,
  config: any
) => {
  const allowance = await readContract(config, {
    address: asset,
    abi: erc20Abi,
    functionName: "allowance",
    args: [userAddress, spender],
  });

  if (allowance == null) {
    throw new Error("Failed to fetch token data or allowance");
  }

  return allowance;
};
