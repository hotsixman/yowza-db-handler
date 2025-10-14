import { Expression } from "./Expression.js";
import sqlString from 'sqlstring';

export class Like extends Expression {
    protected type = "like";

    expression: Expression;
    string: string;

    constructor(expression: Expression, string: string){
        super();
        this.expression = expression;
        this.string = string;
    }

    toString(): string {
        return `${this.expression.toString()} LIKE ${sqlString.escape(this.string)}`;
    }
}
