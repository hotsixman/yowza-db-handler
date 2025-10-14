import { Expression } from "./Expression.js";

export class IsNull extends Expression {
    protected type = "null";

    expression: Expression;

    constructor(expression: Expression){
        super();
        this.expression = expression;
    }

    toString(): string {
        return `${this.expression.toString()} IS NULL`;
    }
}
export class IsNotNull extends Expression {
    protected type = "notnull";

    expression: Expression;

    constructor(expression: Expression){
        super();
        this.expression = expression;
    }

    toString(): string {
        return `${this.expression.toString()} IS NOT NULL`;
    }
}
