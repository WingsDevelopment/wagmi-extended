export enum QueryType {
  MetaDataQuery = "metaDataQuery",
  SemiSensitiveQuery = "semiSensitiveQuery",
  LowSensitiveQuery = "lowSensitiveQuery",
  ExpensiveQuery = "expensiveQuery",
  PriceQuery = "priceQuery",
}

export const queryConfig = {
  metaDataQuery: {
    staleTime: Number.POSITIVE_INFINITY,
    meta: { queryType: QueryType.MetaDataQuery } as const,
  },
  lowSensitiveQuery: {
    staleTime: 60_000,
    meta: { queryType: QueryType.SemiSensitiveQuery } as const,
  },
  semiSensitiveQuery: {
    staleTime: 180_000,
    meta: { queryType: QueryType.LowSensitiveQuery } as const,
  },
  priceQuery: {
    staleTime: 30 * 60 * 1000,
    meta: { queryType: QueryType.PriceQuery } as const,
  },
  expensiveQuery: {
    staleTime: 60 * 60 * 1000,
    meta: { queryType: QueryType.ExpensiveQuery } as const,
  },
};
