import mysql from 'mysql2';
import dotenv from 'dotenv';
import type { QueryCallback, QueryFunction } from '../types';

dotenv.config();

const option = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: isNaN(Number(process.env.DB_PORT)) ? 3306 : Number(process.env.DB_PORT)
};

export async function runQuery<T = any>(callback: QueryCallback): Promise<T> {
    const db = mysql.createConnection(option);
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

    let result;
    let hasError: boolean = false;
    try {
        result = await callback(queryFunction);
    }
    catch (err) {
        result = err;
        hasError = true;
    }
    finally {
        db.destroy();
    }

    if (hasError) {
        throw result;
    }
    else {
        return result;
    }
};