import type { Query } from './module/queryBuilders/Query/Query.js';

export type QueryCallback<T = any> = (queryFunction: QueryFunction) => Promise<T>;
export type QueryFunction<T = any> = (query: string, values?: any[]) => Promise<T>;

export interface DBConnectorOption<T = any> {
    host: string;
    user: string;
    password: string;
    port: T extends number ? number : string | number,
    database: string;
    timezone?: string;
    connectionLimit?: number;
}

export type RunQueryMode = 'pool' | 'poolconn' | 'conn';

export {
    DBSchemaType,
    InferDBSchema
} from './module/queryBuilders/QueryBuilder.js';
export type {
    Query
};

export type ValueOf<T> = T[keyof T];
export type Tail<T extends any[]> = T extends [infer _, ...infer R] ? R : never;

export type UnionToIntersection<U> =
    (U extends any ? (x: U) => 0 : never) extends (x: infer I) => 0 ? I : never;

export type UnionKeys<T> = T extends any ? keyof T & string : never;