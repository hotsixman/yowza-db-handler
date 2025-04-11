export type QueryCallback<T = any> = (queryFunction: QueryFunction) => Promise<T>;
export type QueryFunction<T = any> = (query: string, values?: any[]) => Promise<T>;

export interface DBConnectorOption<T = any> {
    host: string;
    user: string;
    password: string;
    port: T extends number ? number : string | number,
    database: string;
    timezone?:string;
    connectionLimit?: number;
}

export type RunQueryMode = 'pool' | 'poolconn' | 'conn';

export type ValueOf<T> = T[keyof T];
export type Tail<T extends any[]> = T extends [infer _, ...infer R] ? R : never;

export type * from './module/queryBuilders/types.js';