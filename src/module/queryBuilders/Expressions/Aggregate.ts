import { Expression } from "./Expression.js";

export abstract class Aggregate extends Expression {
    protected type = "aggregate";
    constructor(){
        super()
    }
}

export namespace Aggregate {
    export class Count extends Aggregate {
        expr?: Expression;
        constructor(expr?: Expression) {
            super();
            this.expr = expr;
        }

        toString(): string {
            if (!this.expr) {
                return `COUNT(*)`;
            }
            return `COUNT(${this.expr})`;
        }
    }
}