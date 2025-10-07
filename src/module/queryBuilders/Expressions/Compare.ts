import { Expression } from "./Expression.js";

export class Compare extends Expression {
    protected type = 'compare';
    private expression1: Expression;
    private expression2: Expression;
    private comparisonOperator: Compare.ComparisonOperator;

    constructor(expression1: Expression, comparisonOperator: Compare.ComparisonOperator, expression2: Expression) {
        super();
        this.expression1 = expression1;
        this.expression2 = expression2;
        this.comparisonOperator = comparisonOperator;
    }

    toString(): string {
        return `${this.expression1} ${this.comparisonOperator} ${this.expression2}`;
    }
}

export namespace Compare{
    export type ComparisonOperator = '=' | '>' | '>=' | '<' | '<=';
}