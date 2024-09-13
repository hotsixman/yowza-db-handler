import { DBConnectorOption } from "../types";
import mysql from 'mysql2';
import type { QueryCallback, QueryFunction } from '../types';

export class DBConnector {
    option: DBConnectorOption<number>;

    constructor(option: DBConnectorOption) {
        if (typeof (option.port) === "string") {
            if (isNaN(Number(option.port))) { throw Error("Cannot convert the value of \"port\" to number."); }
            option.port = Number(option.port)
        }
        this.option = option as unknown as DBConnectorOption<number>;
    }

    async runQuery<T = any>(callback: QueryCallback<T>): Promise<T> {
        const db = mysql.createConnection(this.option);
        db.connect();

        const queryFunction: QueryFunction = (query: string, values?: any[]) => {
            if (values) {
                return new Promise((res, rej) => {
                    db.query(query, values, (err, row) => {
                        if (err) {
                            rej(err);
                        }
                        else {
                            res(row);
                        }
                    })
                });
            }
            else {
                return new Promise((res, rej) => {
                    db.query(query, (err, row) => {
                        if (err) {
                            rej(err);
                        }
                        else {
                            res(row);
                        }
                    })
                });
            }
        }

        let result: T;
        let error;
        let hasError: boolean = false;
        try {
            result = await callback(queryFunction);
        }
        catch (err) {
            error = err;
            hasError = true;
        }
        finally {
            db.destroy();
        }

        if (hasError) {
            throw error;
        }
        else {
            //@ts-expect-error
            return result;
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