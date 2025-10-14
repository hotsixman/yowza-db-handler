import { ResultSetHeader } from "mysql2";
import { QueryFunction, UnionKeys } from "../../../types.js";
import { DBSchemaType } from "../QueryBuilder.js";
import { Query } from "./Query.js";
import { expr, Expr } from "../Expressions/expr.js";
import { Expression } from "../Expressions/Expression.js";
import sqlString from 'sqlstring';
import { Where } from "../Expressions/Where.js";

export class Delete<
    SchemaType extends DBSchemaType,
    const Table extends keyof SchemaType & string,
    const Column extends keyof SchemaType[Table] & string = SchemaType[Table] & string
> extends Query {
    protected type = "delete";
    private table: Table;
    private option?: Partial<Delete.Option>;
    private _where?: Delete.WhereFunction<SchemaType, Table, Column>;
    private _orderBy?: [column: Column, sort: 'asc' | 'desc'][];
    private _limit?: [number, number | undefined];

    constructor(table: Table, option?: Partial<Delete.Option>) {
        super();
        this.table = table;
        this.option = option;
    }

    where(whereFunction: Delete.WhereFunction<SchemaType, Table, Column>): Delete.Stage1<typeof this> {
        this._where = whereFunction;
        return this;
    }

    orderBy(column: Column, sort: 'asc' | 'desc'): Delete.Stage2<typeof this>;
    orderBy(rules: [column: Column, sort: 'asc' | 'desc'][]): Delete.Stage2<typeof this>;
    orderBy(...args: any[]): Delete.Stage2<typeof this> {
        if (Array.isArray(args[0])) { // rules
            this._orderBy = args;
        }
        else { // column
            this._orderBy = [args[0], args[1]];
        }

        return this;
    }

    limit(count: number, offset?: number): Delete.Stage3<typeof this> {
        this._limit = [count, offset];
        return this;
    }

    build(): string {
        const syntax: string[] = ["DELETE FROM"];
        syntax.push(sqlString.escapeId(this.table));

        if (this.option?.lowPriority) {
            syntax.push('LOW_PRIORITY');
        }
        if (this.option?.quick) {
            syntax.push('QUICK');
        }
        if (this.option?.ignore) {
            syntax.push('IGNORE');
        }

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

export namespace Delete {
    export type Option = {
        lowPriority: boolean;
        quick: boolean;
        ignore: boolean;
    }

    export type WhereFunction<
        SchemaType extends DBSchemaType,
        Table extends keyof SchemaType & string = keyof SchemaType & string,
        Column extends keyof SchemaType[Table] & string = UnionKeys<SchemaType[Table]>
    > = (expr: Expr<SchemaType, Table, Column>) => [Expression, ...Expression[]];
}

export namespace Delete {
    export type Stage0<D extends Delete<any, any, any>> = D;
    export type Stage1<D extends Delete<any, any, any>> = Omit<D, 'where'>;
    export type Stage2<D extends Delete<any, any, any>> = Omit<D, 'where' | 'orderBy'>;
    export type Stage3<D extends Delete<any, any, any>> = Omit<D, 'where' | 'orderBy' | 'limit'>;
}