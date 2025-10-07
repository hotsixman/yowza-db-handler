import { QueryBuilder } from "./base.js";
import sqlString from 'sqlstring';

export class Orderby extends QueryBuilder {
    protected column: string;
    protected sort: 'asc' | 'desc';

    constructor(upper: QueryBuilder, column: string, sort: Orderby['sort']) {
        super(upper);
        this.column = column;
        this.sort = sort;
    }

    protected toString(): string {
        return `ORDER BY ${sqlString.escapeId(this.column)} ${this.sort.toUpperCase()}`
    }
}