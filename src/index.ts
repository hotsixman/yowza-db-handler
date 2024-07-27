import { runQuery } from "./module/runQuery.js";
import { QueryCallback } from "./types";

export function defineDBHandler<T extends any[], K = any>(handler: (...args: T) => QueryCallback<K>) {
    const runFunc = async (...args: T) => {
        return runQuery(handler(...args)) as K
    }

    const newHandler = Object.assign(
        runFunc,
    {
        getCallback: handler
    })
    return newHandler;
}

export {runQuery}