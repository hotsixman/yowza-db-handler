export type QueryCallback<T = any> = (queryFunction: QueryFunction) => Promise<T>;
export type QueryFunction<T = any> = (query: string, values?: any[]) => Promise<T>;
//# sourceMappingURL=types.d.ts.map