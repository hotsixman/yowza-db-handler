import { runQuery } from "./module/runQuery.js";
import { QueryCallback } from "./types";
export declare function defineDBHandler<T extends any[], K = any>(handler: (...args: T) => QueryCallback<K>): ((...args: T) => Promise<K>) & {
    getCallback: (...args: T) => QueryCallback<K>;
};
export { runQuery };
//# sourceMappingURL=index.d.ts.map