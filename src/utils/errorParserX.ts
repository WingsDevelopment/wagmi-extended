import { BaseError, ContractFunctionRevertedError } from "viem";

/**
 * Default error mapping that contains a set of error identifiers mapped to user-friendly error messages.
 */
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

/**
 * A mutable copy of the default error mapping that can be extended or overridden by users.
 */
let currentErrorMapping: Record<string, string> = { ...defaultErrorMapping };

/**
 * Merges a custom error mapping into the current error mapping.
 * Custom values override any existing keys.
 *
 * @param customMapping - An object containing error keys and the corresponding custom messages.
 *
 * @example
 * setErrorMapping({
 *   ErrorNotEnoughAllowance: "Custom message: Please approve tokens first!",
 *   NewCustomError: "A custom error occurred."
 * });
 */
export const setErrorMapping = (
  customMapping: Record<string, string>
): void => {
  currentErrorMapping = { ...currentErrorMapping, ...customMapping };
};

/**
 * Resets the current error mapping to the default error mapping.
 *
 * @example
 * resetErrorMapping();
 */
export const resetErrorMapping = (): void => {
  currentErrorMapping = {};
};

/**
 * Retrieves the current error mapping.
 *
 * @returns The current error mapping object.
 *
 * @example
 * const mapping = getErrorMapping();
 * console.log(mapping);
 */
export const getErrorMapping = (): Record<string, string> =>
  currentErrorMapping;

/**
 * Parses an error object and returns a user-friendly error message.
 *
 * The function checks if the error is a ContractFunctionRevertedError by attempting to walk through
 * the error using its `walk` method. If a matching error is found and its error key exists in the
 * current error mapping, the corresponding custom message will be returned. Otherwise, it falls back
 * to the error's own message properties.
 *
 * @param error - The error object, potentially including additional error details.
 * @returns A user-friendly error message.
 *
 * @example
 * const message = getParsedError(someError);
 * console.log(message); // Outputs a custom error message or a default error message.
 */
export const getParsedErrorX = (error: any | BaseError): string => {
  const defaultMessage = "An unknown error occurred. Please contact support.";
  let message = defaultMessage;
  let errorKey = "";

  const revertedError = error?.walk
    ? error.walk((err: unknown) => err instanceof ContractFunctionRevertedError)
    : null;
  if (revertedError instanceof ContractFunctionRevertedError) {
    errorKey =
      revertedError.data?.errorName ??
      revertedError.signature ??
      revertedError.reason ??
      "";
    if (currentErrorMapping[errorKey]) return currentErrorMapping[errorKey];
  }

  message = error.shortMessage || error.details || error.message || message;
  return message;
};
