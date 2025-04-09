import { QueryKey, useQueryClient } from "@tanstack/react-query";

/**
 * Hook to invalidate multiple queries in the React Query cache.
 *
 * @returns An object with the invalidateMany function.
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  const invalidateMany = async (queries: (QueryKey | undefined)[]) => {
    const promises = queries.map((queryKey) =>
      queryClient.invalidateQueries({ queryKey })
    );
    await Promise.all(promises);
  };

  return { invalidateMany };
}
