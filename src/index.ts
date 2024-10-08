import { defaultDBConnector } from './module/defaultDBConnector.js';
import { QueryCallback } from './types.js';

export const defineDBHandler = function<T extends any[], K = any>(handlers: (...args: T) => QueryCallback<K>){
    return defaultDBConnector.defineDBHandler(handlers);
};
export const runQuery = async function<T = any>(callback: QueryCallback<T>){
    return await defaultDBConnector.runQuery(callback);
};

export { DBConnector } from './module/DBConnector.js';
export { defaultDBConnector };