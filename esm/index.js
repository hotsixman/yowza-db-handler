import { runQuery } from "./module/runQuery.js";
export function defineDBHandler(handler) {
    const runFunc = async (...args) => {
        return runQuery(handler(...args));
    };
    const newHandler = Object.assign(runFunc, {
        getCallback: handler
    });
    return newHandler;
}
export { runQuery };
//# sourceMappingURL=index.js.map