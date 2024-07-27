"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runQuery = void 0;
const mysql2_1 = __importDefault(require("mysql2"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const option = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: isNaN(Number(process.env.DB_PORT)) ? 3306 : Number(process.env.DB_PORT)
};
async function runQuery(callback) {
    const db = mysql2_1.default.createConnection(option);
    db.connect();
    const queryFunction = (query, values) => {
        if (values) {
            return new Promise((res, rej) => {
                db.query(query, values, (err, row) => {
                    if (err) {
                        rej(err);
                    }
                    else {
                        res(row);
                    }
                });
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
                });
            });
        }
    };
    let result;
    let hasError = false;
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
}
exports.runQuery = runQuery;
;
//# sourceMappingURL=runQuery.js.map