import { DBConnectorOption } from "../types";
import mysql, { Connection, createPool, Pool, PoolConnection } from 'mysql2';
import type { QueryCallback, QueryFunction, RunQueryMode } from '../types';

export class DBConnector {
    static getRunQueryMode(): RunQueryMode {
        const env = process?.env?.DB_CONN_MODE;
        //@ts-expect-error
        if(['pool', 'poolconn', 'conn'].includes(env)){
            return env as RunQueryMode;
        }
        return 'conn';
    }

    readonly option: DBConnectorOption<number>;
    private pool?: Pool;

    constructor(option: DBConnectorOption) {
        if (typeof (option.port) === "string") {
            if (isNaN(Number(option.port))) { throw Error("Cannot convert the value of \"port\" to number."); }
            option.port = Number(option.port)
        }
        this.option = option as unknown as DBConnectorOption<number>;
    }

    private promisifyConnection(conn: Connection | PoolConnection | Pool, query: string, values?: any[]) {
        return new Promise<{ result: any, error: any, hasError: boolean }>((res) => {
            let result: any;
            let error: any;
            let hasError = false;

            if (values) {
                conn.execute(query, values, (err, row) => {
                    if (err) {
                        hasError = true;
                        error = err;
                    }
                    else {
                        result = row;
                    }

                    res({
                        result,
                        error,
                        hasError
                    });
                })
            }
            else {
                conn.execute(query, (err, row) => {
                    if (err) {
                        hasError = true;
                        error = err;
                    }
                    else {
                        result = row;
                    }

                    res({
                        result,
                        error,
                        hasError
                    });
                })
            }
        })
    }

    private queryFunction: Record<'connectionMode' | 'poolMode' | 'poolConnectionMode', QueryFunction> = {
        connectionMode: async (query: string, values?: any[]) => {
            const connection = mysql.createConnection(this.option);
            connection.connect();

            const queryResult = await this.promisifyConnection(connection, query, values);

            connection.end();

            if (queryResult.hasError) {
                throw queryResult.error;
            }
            else {
                return queryResult.result;
            }
        },
        poolConnectionMode: (query: string, values?: any[]) => {
            return new Promise((res, rej) => {
                this.getPool().getConnection((err, connection) => {
                    if (err) {
                        rej(err);
                        return;
                    }

                    const queryResultPromise = this.promisifyConnection(connection, query, values);

                    queryResultPromise
                        .then((queryResult) => {
                            connection.release();

                            if (queryResult.hasError) {
                                rej(queryResult.error);
                            }
                            else {
                                res(queryResult.result);
                            }
                        })
                })
            })
        },
        poolMode: async(query: string, values?: any[]) => {
            const pool = this.getPool();

            const queryResult = await this.promisifyConnection(pool, query, values);

            if (queryResult.hasError) {
                throw queryResult.error;
            }
            else {
                return queryResult.result;
            }
        }
    }

    getPool(): Pool {
        if (!this.pool) {
            this.pool = createPool(this.option);
        }
        return this.pool;
    }

    async runQuery<T = any>(callback: QueryCallback<T>, mode: RunQueryMode = DBConnector.getRunQueryMode()): Promise<T> {
        if (mode === 'poolconn') {
            return await callback(this.queryFunction.poolConnectionMode);
        }
        else if (mode === 'conn') {
            return await callback(this.queryFunction.connectionMode);
        }
        else {
            return await callback(this.queryFunction.poolMode);
        }
    }

    defineDBHandler<T extends any[], K = any>(handlers: (...args: T) => QueryCallback<K>) {
        const runFunc = async (...args: T) => {
            return this.runQuery(handlers(...args)) as K
        }

        const dbHandler = Object.assign(runFunc, { getCallback: handlers });

        return dbHandler;
    }
}