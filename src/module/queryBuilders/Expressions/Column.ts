import { Expression } from "./Expression.js";
import sqlString from 'sqlstring';

export class Column extends Expression {
    protected type = 'column';
    columnName: string;

    constructor(columnName: string) {
        super();
        this.columnName = columnName;
    }

    toString(): string {
        return sqlString.escapeId(this.columnName);
    }
}