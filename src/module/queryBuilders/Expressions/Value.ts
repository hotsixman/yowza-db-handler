import { Expression } from "./Expression.js";
import sqlString from 'sqlstring';

export class Value<T> extends Expression {
    value: T;
    protected type = "value";

    constructor(value: T) {
        super();
        this.value = value;
    }

    toString(): string {
        return sqlString.escape(this.value);
    }
}