import { ResultSetHeader } from "mysql2";
import { QueryFunction, ValueOf } from "../../../types.js";
import { expr, Expr } from "../Expressions/expr.js";
import { Expression } from "../Expressions/Expression.js";
import { DBSchemaType } from "../QueryBuilder.js";
import { Query } from "./Query.js";
import sqlString from 'sqlstring';
import { Select } from "./Select.js";

export class Insert<
    SchemaType extends DBSchemaType,
    const Table extends keyof SchemaType & string,
    const Column extends keyof SchemaType[Table] & string
> extends Query {
    protected type = "insert";
    private table: Table;
    private _value?: Insert.ValueFunction<SchemaType, Table, Column>;
    private _from?: Select.AllStage<Select<any, any, any, any, any>>;
    private duplicateManage?: 'ignore' | 'replace' | ['update', Insert.ValueFunction<SchemaType, Table, Column>]

    constructor(table: Table) {
        super();
        this.table = table;
    }

    set(value: Insert.ValueFunction<SchemaType, Table, Column>): Insert.Stage1<typeof this> {
        this._value = value;
        return this;
    }

    from<
        const Table extends keyof SchemaType & string,
        const Column extends Select.Column<SchemaType, Table>,
        const CF extends Select.ColumnFunction<SchemaType, Table, Column> | '*',
        const J extends Select.JoinDatas<SchemaType>
    >(select: Select.AllStage<Select<SchemaType, Table, Column, CF, J>>): Insert.Stage1<typeof this> {
        this._from = select;
        return this;
    }

    onDuplicate(manage: 'ignore' | 'replace'): Insert.Stage2<typeof this>;
    onDuplicate(manage: 'update', value: Insert.ValueFunction<SchemaType, Table, Column>): Insert.Stage2<typeof this>;
    onDuplicate(arg1: 'ignore' | 'replace' | 'update', arg2?: Insert.ValueFunction<SchemaType, Table, Column>): Insert.Stage2<typeof this> {
        if (arg1 === "ignore" || arg1 === "replace") {
            this.duplicateManage = arg1;
        }
        else if (arg1 === "update" && arg2) {
            this.duplicateManage = [arg1, arg2];
        }
        return this;
    }

    build(): string {
        const syntax: string[] = [];
        if (this.duplicateManage === "replace") {
            syntax.push("REPLACE INTO");
        }
        else if (this.duplicateManage === "ignore") {
            syntax.push("INSERT INGORE INTO");
        }
        else {
            syntax.push("INSERT INTO");
        }
        syntax.push(sqlString.escapeId(this.table));

        // values
        if (this._value) {
            const columns: string[] = [];
            const values: string[] = [];
            for (const [col, val] of Object.entries<ValueOf<Insert.Value<SchemaType, Table, Column>>>(this._value(expr()))) {
                columns.push(sqlString.escapeId(col));
                if (val instanceof Expression) {
                    values.push(val.toString());
                }
                else {
                    values.push(sqlString.escape(val))
                }
            }
            syntax.push(`(${columns.join(', ')})`);
            syntax.push('VALUES');
            syntax.push(`(${values.join(', ')})`);
        }
        else if (this._from) {
            const { query: selectQuery, list: selectColumnList } = this._from.build(true);
            const columns = selectColumnList.map(([_, a]) => a);
            syntax.push(`(${columns.join(', ')})`);
            syntax.push(selectQuery);
        }

        // on duplicate key update
        if (Array.isArray(this.duplicateManage)) {
            syntax.push("ON DUPLICATE KEY UPDATE");
            const set: string[] = [];
            for (const [col, val] of Object.entries<ValueOf<Insert.Value<SchemaType, Table, Column>>>(this.duplicateManage[1](expr()))) {
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
        }

        return syntax.join(' ');
    }

    async execute(run: QueryFunction): Promise<ResultSetHeader> {
        return await run(this.build())
    }
}

export namespace Insert {
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
}

export namespace Insert {
    export type Stage0<I extends Insert<any, any, any>> = Omit<I, 'build' | 'execute'>;
    export type Stage1<I extends Insert<any, any, any>> = Omit<I, 'set' | 'from'>;
    export type Stage2<I extends Insert<any, any, any>> = Omit<I, 'set' | 'from' | 'onDuplicate'>
}