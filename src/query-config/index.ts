export const queryConfig = {
  metaDataQuery: {
    staleTime: Number.POSITIVE_INFINITY,
    meta: { category: "metadata" } as const,
  },
  lowSensitiveQuery: {
    staleTime: 60_000,
    meta: { category: "lowSensitive" } as const,
  },
  semiSensitiveQuery: {
    staleTime: 180_000,
    meta: { category: "semiSensitive" } as const,
  },
  expensiveQuery: {
    staleTime: 60 * 60 * 1000,
    meta: { category: "expensive" } as const,
  },
};
