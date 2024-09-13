import { defaultDBConnector } from './module/defaultDBConnector.js';

export const defineDBHandler = defaultDBConnector.defineDBHandler;
export const runQuery = defaultDBConnector.runQuery;

export { DBConnector } from './module/DBConnector.js';
export { defaultDBConnector };