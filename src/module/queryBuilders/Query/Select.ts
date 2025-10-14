import { QueryFunction, UnionKeys, UnionToIntersection } from "../../../types.js";
import { Aggregate } from "../Expressions/Aggregate.js";
import { Expression } from "../Expressions/Expression.js";
import { Expr, expr } from "../Expressions/expr.js";
import { Where } from "../Expressions/Where.js";
import { DBSchemaType } from "../QueryBuilder.js";
import { Query } from "./Query.js";
import sqlString from 'sqlstring';
import { Value } from "../Expressions/Value.js";
import { RowDataPacket } from "mysql2";

export class Select<
    SchemaType extends DBSchemaType,
    const Table extends keyof SchemaType & string,
    const Column extends Select.Column<SchemaType, Table>,
    const CF extends Select.ColumnFunction<SchemaType, Table, Column> | '*',
    const J extends Select.JoinDatas<SchemaType>
> extends Query {
    protected type = "select";
    private table: Table;
    private columns: CF;
    private joins: J = [] as unknown as J;
    private _where: Select.WhereFunction<SchemaType> | null = null;
    private _groupBy: Select.GroupByFuntion<SchemaType, Table, J> | null = null;
    private _having: Select.WhereFunction<SchemaType> | null = null;
    private _orderBy: [column: Select.ColumnWithTable<SchemaType, Table | Select.JoinTables<SchemaType, J>>, sort: 'asc' | 'desc'][] | null = null;
    private _limit: [number, number | undefined] | null = null;
    private _distinct: boolean = false;

    constructor(table: Table, columns: CF, distinct?: true) {
        super();
        this.table = table;
        this.columns = columns;
        this._distinct = distinct ?? this._distinct;
    }

    // syntax
    join<
        const JTable extends keyof SchemaType & string,
        const JColumn extends Select.Column<SchemaType, JTable>,
        const JCF extends Select.ColumnFunction<SchemaType, JTable, JColumn> | '*',
        const JType extends Select.JoinType,
        const JCondition extends Select.WhereFunction<SchemaType, Table | JTable | J[number][0]>
    >(table: JTable, columns: JCF, type: JType, condition: JCondition) {
        this.joins.push([table, columns, type, condition])
        return this as unknown as Select<SchemaType, Table, Column, CF, [...J, [JTable, JCF, JType, JCondition]]>;
    }

    where(whereFunction: Select.WhereFunction<SchemaType>) {
        this._where = whereFunction;
        return this as Select.Stage1<typeof this>;
    }

    groupBy(groupByFunction: Select.GroupByFuntion<SchemaType, Table, J>) {
        this._groupBy = groupByFunction;
        return this as Select.Stage2<typeof this>;
    }

    having(havingFunction: Select.WhereFunction<SchemaType>) {
        this._having = havingFunction;
        return this as Select.Stage3<typeof this>;
    }

    orderBy(column: Select.ColumnWithTable<SchemaType, Table | Select.JoinTables<SchemaType, J>>, sort: 'asc' | 'desc'): Select.Stage4<typeof this>
    orderBy(...rules: [column: Select.ColumnWithTable<SchemaType, Table | Select.JoinTables<SchemaType, J>>, sort: 'asc' | 'desc'][]): Select.Stage4<typeof this>
    orderBy(...args: any[]) {
        if (args.length === 0) return this;
        if (Array.isArray(args[0])) {
            this._orderBy = args;
        }
        else {
            const column: Select.ColumnWithTable<SchemaType, Table | Select.JoinTables<SchemaType, J>> = args[0];
            const sort: 'asc' | 'desc' = args[1];
            this._orderBy = [[column, sort]];
        }
        return this;
    }

    limit(count: number, offset?: number): Select.Stage5<typeof this> {
        this._limit = [count, offset];
        return this;
    }

    private getSelectList(table: string, columns: Select.ColumnFunction<any, any, any> | '*') {
        const list: [string, string][] = [];
        if (columns === "*") {
            list.push([`${sqlString.escapeId(table)}.*`, '']);
        }
        else {
            for (const [alias, expression] of Object.entries(columns(expr()))) {
                if (typeof (expression) === "string") {
                    const original = sqlString.escapeId(`${table}.${expression}`);
                    list.push([original, sqlString.escapeId(alias)]);
                }
                else {
                    list.push([expression, sqlString.escapeId(alias)]);
                }
            }
        }
        return list;
    }

    build(): string;
    build(needList: true): { query: string, list: [string, string][] }
    build(needList?: boolean) {
        const syntax: string[] = ["SELECT"];

        // select list
        const list: [string, string][] = [];
        list.push(...this.getSelectList(this.table, this.columns))
        this.joins.forEach((join) => {
            list.push(...this.getSelectList(join[0], join[1]));
        });
        syntax.push(list.map(([o, a]) => a ? `${o} as ${a}` : `${o}`).join(', '));

        // from
        syntax.push('FROM');
        syntax.push(sqlString.escapeId(this.table));

        // join
        this.joins.forEach((join) => {
            const joinSyntax: string[] = [];
            joinSyntax.push(join[2].toUpperCase());
            joinSyntax.push('JOIN');
            joinSyntax.push(sqlString.escapeId(join[0]));
            joinSyntax.push('ON');
            joinSyntax.push(new Where(...join[3](expr())).condition())
            syntax.push(joinSyntax.join(' '));
        });

        // where
        if (this._where) {
            const where = new Where(...this._where(expr()));
            syntax.push(where.toString());
        }

        // groupby
        if (this._groupBy) {
            const groupBySyntax: string[] = ['GROUP BY'];
            const expressions: string[] = [];
            for (const expression of Object.values(this._groupBy(expr()))) {
                expressions.push(expression.toString());
            }
            groupBySyntax.push(expressions.join(', '))
            syntax.push(groupBySyntax.join(' '));
            // having
            if (this._having) {
                const havingSyntax: string[] = ['HAVING'];
                havingSyntax.push(new Where(...this._having(expr())).condition());
                syntax.push(havingSyntax.join(' '));
            }
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

        const query = syntax.join(' ');
        if (needList) {
            return {
                query,
                list
            }
        }
        else {
            return query;
        }
    }

    async execute(run: QueryFunction) {
        return await run(this.build()) as Select.Return<SchemaType, Table, Column, CF, J> & RowDataPacket;
    }
}

export namespace Select {
    // definition
    export type Column<
        SchemaType extends DBSchemaType,
        Table extends keyof SchemaType & string
    > = keyof SchemaType[Table] & string;
    export type ColumnFunction<
        SchemaType extends DBSchemaType,
        Table extends keyof SchemaType & string,
        Column extends keyof SchemaType[Table] & string
    > = (expr: Expr<SchemaType, Table, Column>) => {
        [Alias: string]: Column | Aggregate | Expression
    };

    // join
    export type JoinType = 'inner' | 'left' | 'right' | 'cross' | 'self' | 'natural';
    export type JoinData<
        SchemaType extends DBSchemaType,
        Table extends keyof SchemaType & string,
        Column extends keyof SchemaType[Table] & string
    > = [table: Table, CF: ColumnFunction<SchemaType, Table, Column> | '*', type: JoinType, condition: WhereFunction<SchemaType>];
    export type JoinDatas<SchemaType extends DBSchemaType> = (JoinData<SchemaType, any, any>)[];
    export type JoinTables<SchemaType extends DBSchemaType, J extends JoinDatas<SchemaType>> = J[number][0];

    // where
    export type WhereFunction<
        SchemaType extends DBSchemaType,
        Table extends keyof SchemaType & string = keyof SchemaType & string,
        Column extends keyof SchemaType[Table] & string = UnionKeys<SchemaType[Table]>
    > = (expr: Expr<SchemaType, Table, Column>) => [Expression, ...Expression[]];

    // groupby
    export type GroupByFuntion<
        SchemaType extends DBSchemaType,
        Table extends keyof SchemaType & string,
        J extends JoinDatas<SchemaType>
    > = (expr: Expr<SchemaType, Table | JoinTables<SchemaType, J>>) => [Expression, ...Expression[]];

    // return
    export type SingleReturn<
        SchemaType extends DBSchemaType,
        Table extends keyof SchemaType & string,
        Column extends Select.Column<SchemaType, Table>,
        CF extends Select.ColumnFunction<SchemaType, Table, Column> | '*',
    > = CF extends Select.ColumnFunction<SchemaType, Table, Column> ?
        {
            [Alias in keyof ReturnType<CF> & string as Alias]:
            ReturnType<CF>[Alias] extends Aggregate ?
            number :
            ReturnType<CF>[Alias] extends Value<any> ?
            ReturnType<CF>[Alias]['value'] :
            ReturnType<CF>[Alias] extends Expression ?
            any :
            ReturnType<CF>[Alias] extends Column ?
            SchemaType[Table][ReturnType<CF>[Alias]] :
            never
        }
        :
        {
            [Alias in Column as Alias]: SchemaType[Table][Alias]
        };
    export type Return<
        SchemaType extends DBSchemaType,
        Table extends keyof SchemaType & string,
        Column extends Select.Column<SchemaType, Table>,
        CF extends Select.ColumnFunction<SchemaType, Table, Column> | '*',
        J extends Select.JoinDatas<SchemaType>
    > =
        J['length'] extends 0 ?
        Select.SingleReturn<SchemaType, Table, Column, CF>
        :
        Select.SingleReturn<SchemaType, Table, Column, CF>
        &
        (
            UnionToIntersection<{
                [I in keyof J]:
                Select.SingleReturn<SchemaType, J[I][0], Select.Column<SchemaType, J[I][0]>, J[I][1]>
            }[number]>
        );

    // etc
    export type ColumnWithTable<
        SchemaType extends DBSchemaType,
        Table extends keyof SchemaType & string
    > = Table extends keyof SchemaType ? `${Table}.${keyof SchemaType[Table] & string}` : never;
}

export namespace Select {
    export type Stage0<S extends Select<any, any, any, any, any>> = Omit<S, 'having'>;
    export type Stage1<S extends Select<any, any, any, any, any>> = Omit<S, 'join' | 'where' | 'having'>;
    export type Stage2<S extends Select<any, any, any, any, any>> = Omit<S, 'join' | 'where' | 'groupBy'>;
    export type Stage3<S extends Select<any, any, any, any, any>> = Omit<S, 'join' | 'where' | 'groupBy' | 'having'>;
    export type Stage4<S extends Select<any, any, any, any, any>> = Omit<S, 'join' | 'where' | 'groupBy' | 'having' | 'orderBy'>;
    export type Stage5<S extends Select<any, any, any, any, any>> = Omit<S, 'join' | 'where' | 'groupBy' | 'having' | 'orderBy' | 'limit'>;

    export type AllStage<S extends Select<any, any, any, any, any>> = Stage0<S> | Stage1<S> | Stage2<S> | Stage3<S> | Stage4<S> | Stage5<S>;
}

export namespace Select {
    export function columns<
        SchemaType extends DBSchemaType,
        const Table extends keyof SchemaType & string,
        const Column extends Select.Column<SchemaType, Table>,
        const CF extends Select.ColumnFunction<SchemaType, Table, Column> | '*',
        const J extends Select.JoinDatas<SchemaType>
    >(select: Select<SchemaType, Table, Column, CF, J>): CF {
        //@ts-expect-error
        const columns = select.columns;
        return columns as unknown as CF;
    }
}