import { QueryFunction, UnionToIntersection } from "../../../types.js";
import { DBSchemaType } from "../QueryBuilder.js";
import { Query } from "./Query.js";
import { Select } from "./Select.js";
import sqlString from 'sqlstring';

export class Union<
    SchemaType extends DBSchemaType,
    const Table extends keyof SchemaType & string,
    const Column extends keyof SchemaType[Table] & string,
    Selects extends Select.AllStage<Select<DBSchemaType, Table, Column, Select.ColumnFunction<SchemaType, Table, Column> | '*', any>>[]
> extends Query {
    protected type = 'union';
    private selects: Selects;
    private mode?: 'all';
    private _orderBy?: [column: Column, sort: 'asc' | 'desc'][];
    private _limit?: [number, number | undefined];

    constructor(selects: Selects, mode?: 'all') {
        super();
        this.selects = selects;
        this.mode = mode;
    }

    orderBy(column: Column, sort: 'asc' | 'desc'): Union.Stage1<typeof this>;
    orderBy(rules: [column: Column, sort: 'asc' | 'desc'][]): Union.Stage1<typeof this>;
    orderBy(...args: any[]): Union.Stage1<typeof this> {
        if (Array.isArray(args[0])) { // rules
            this._orderBy = args;
        }
        else { // column
            this._orderBy = [args[0], args[1]];
        }

        return this;
    }

    limit(count: number, offset?: number): Union.Stage2<typeof this> {
        this._limit = [count, offset];
        return this;
    }

    build(): string {
        const syntax: string[] = [];

        const selectQueries = this.selects.map((s) => s.build());
        syntax.push(selectQueries.join(this.mode === 'all' ? ' UNION ALL ' : ' UNION '));

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

    async execute(run: QueryFunction): Promise<
        UnionToIntersection<
            Awaited<
                ReturnType<Selects[number]['execute']>
            >
        >
    > {
        return await run(this.build())
    }
}

export namespace Union {
    export type Stage1<U extends Union<any, any, any, any>> = Omit<U, 'orderby'>;
    export type Stage2<U extends Union<any, any, any, any>> = Omit<U, 'orderby' | 'limit'>;
}