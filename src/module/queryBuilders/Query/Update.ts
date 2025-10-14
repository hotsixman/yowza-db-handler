import { ResultSetHeader } from "mysql2";
import { QueryFunction, UnionKeys, ValueOf } from "../../../types.js";
import { expr, Expr } from "../Expressions/expr.js";
import { Expression } from "../Expressions/Expression";
import { DBSchemaType } from "../QueryBuilder.js";
import { Query } from "./Query.js";
import sqlString from 'sqlstring';
import { Where } from "../Expressions/Where.js";

export class Update<
    SchemaType extends DBSchemaType,
    const Table extends keyof SchemaType & string,
    const Column extends keyof SchemaType[Table] & string
> extends Query {
    protected type = "update";
    private table: Table;
    private valueFunction: Update.ValueFunction<SchemaType, Table, Column>;
    private _where?: Update.WhereFunction<SchemaType, Table, Column>;
    private _orderBy?: [column: Column, sort: 'asc' | 'desc'][];
    private _limit?: [number, number | undefined];

    constructor(table: Table, valueFunction: Update.ValueFunction<SchemaType, Table, Column>) {
        super();
        this.table = table;
        this.valueFunction = valueFunction;
    }

    where(whereFunction: Update.WhereFunction<SchemaType, Table, Column>): Update.Stage1<typeof this> {
        this._where = whereFunction;
        return this;
    }

    orderBy(column: Column, sort: 'asc' | 'desc'): Update.Stage2<typeof this>;
    orderBy(rules: [column: Column, sort: 'asc' | 'desc'][]): Update.Stage2<typeof this>;
    orderBy(...args: any[]): Update.Stage2<typeof this> {
        if (Array.isArray(args[0])) { // rules
            this._orderBy = args;
        }
        else { // column
            this._orderBy = [args[0], args[1]];
        }

        return this;
    }

    limit(count: number, offset?: number): Update.Stage3<typeof this> {
        this._limit = [count, offset];
        return this;
    }

    build(): string {
        const syntax: string[] = ["UPDATE"];
        syntax.push(sqlString.escapeId(this.table));
        syntax.push("SET")

        const set: string[] = [];
        for (const [col, val] of Object.entries<ValueOf<Update.Value<SchemaType, Table, Column>>>(this.valueFunction(expr()))) {
            let valString;
            if (val instanceof Expression) {
                valString = val.toString();
            }
            else {
                valString = sqlString.escape(val);
            }

            set.push(`${sqlString.escapeId(col)} = ${valString}`);
        }
        syntax.push(set.join(', '))

        // where
        if (this._where) {
            const where = new Where(...this._where(expr()));
            syntax.push(where.toString());
        }

        // orderby
        if (this._orderBy) {
            const orderByRules: string[] = [];
            this._orderBy.forEach(([column, sort]) => {
                orderByRules.push(`${sqlString.escapeId(column)} ${sort.toUpperCase()}`);
            });
            syntax.push(`ORDER BY ${orderByRules.join(', ')}`);
        }

        // limit
        if (this._limit) {
            if (this._limit[1] === undefined) {
                syntax.push(`LIMIT ${this._limit[0]}`);
            }
            else {
                syntax.push(`LIMIT ${this._limit[0]} OFFSET ${this._limit[1]}`);
            }
        }

        return syntax.join(' ');
    }

    async execute(run: QueryFunction): Promise<ResultSetHeader> {
        return await run(this.build())
    }
}

export namespace Update {
    export type Value<
        SchemaType extends DBSchemaType,
        Table extends keyof SchemaType & string,
        Column extends keyof SchemaType[Table] & string
    > = Partial<{
        [C in Column]: SchemaType[Table][C] | Expression
    }>;
    export type ValueFunction<
        SchemaType extends DBSchemaType,
        Table extends keyof SchemaType & string,
        Column extends keyof SchemaType[Table] & string
    > = (expr: Expr<SchemaType, Table, Column>) => Value<SchemaType, Table, Column>;
    export type WhereFunction<
        SchemaType extends DBSchemaType,
        Table extends keyof SchemaType & string = keyof SchemaType & string,
        Column extends keyof SchemaType[Table] & string = UnionKeys<SchemaType[Table]>
    > = (expr: Expr<SchemaType, Table, Column>) => [Expression, ...Expression[]];
}

export namespace Update {
    export type Stage0<U extends Update<any, any, any>> = U;
    export type Stage1<U extends Update<any, any, any>> = Omit<U, 'where'>;
    export type Stage2<U extends Update<any, any, any>> = Omit<U, 'where' | 'orderBy'>;
    export type Stage3<U extends Update<any, any, any>> = Omit<U, 'where' | 'orderBy' | 'limit'>;
}