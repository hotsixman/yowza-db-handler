"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runQuery = exports.defineDBHandler = void 0;
const runQuery_js_1 = require("./module/runQuery.js");
Object.defineProperty(exports, "runQuery", { enumerable: true, get: function () { return runQuery_js_1.runQuery; } });
function defineDBHandler(handler) {
    const runFunc = async (...args) => {
        return (0, runQuery_js_1.runQuery)(handler(...args));
    };
    const newHandler = Object.assign(runFunc, {
        getCallback: handler
    });
    return newHandler;
}
exports.defineDBHandler = defineDBHandler;
//# sourceMappingURL=index.js.map