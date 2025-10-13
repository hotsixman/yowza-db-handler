import { QueryFunction, ValueOf } from "../../../types.js";
import { expr, Expr } from "../Expressions/expr.js";
import { Expression } from "../Expressions/Expression";
import { DBSchemaType } from "../QueryBuilder.js";
import { Query } from "./Query.js";
import sqlString from 'sqlstring';

export class Insert<
    SchemaType extends DBSchemaType,
    const Table extends keyof SchemaType & string,
    const Column extends keyof SchemaType[Table] & string
> extends Query {
    type = "insert";
    private table: Table;
    private valueFunction: Insert.ValueFunction<SchemaType, Table, Column>;
    private duplicateManage?: 'ignore' | 'replace' | ['update', Insert.ValueFunction<SchemaType, Table, Column>]

    constructor(table: Table, valueFunction: Insert.ValueFunction<SchemaType, Table, Column>) {
        super();
        this.table = table;
        this.valueFunction = valueFunction;
    }

    onDuplicate(manage: 'ignore' | 'replace'): Insert.Stage1<Insert<any, any, any>>;
    onDuplicate(manage: 'update', value: Insert.ValueFunction<SchemaType, Table, Column>): Insert.Stage1<Insert<any, any, any>>;
    onDuplicate(arg1: 'ignore' | 'replace' | 'update', arg2?: Insert.ValueFunction<SchemaType, Table, Column>) {
        if (arg1 === "ignore" || arg1 === "replace") {
            this.duplicateManage = arg1;
        }
        else if (arg1 === "update" && arg2) {
            this.duplicateManage = [arg1, arg2];
        }
        return this as Insert.Stage1<typeof this>;
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

        const columns: string[] = [];
        const values: string[] = [];
        for (const [col, val] of Object.entries<ValueOf<Insert.Value<SchemaType, Table, Column>>>(this.valueFunction(expr()))) {
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

        if (Array.isArray(this.duplicateManage)) {
            syntax.push("ON DUPLICATE KEY UPDATE");
            const set: string[] = [];
            for (const [col, val] of Object.entries<ValueOf<Insert.Value<SchemaType, Table, Column>>>(this.duplicateManage[1](expr()))) {
                let valString;
                if(val instanceof Expression){
                    valString = val.toString();
                }
                else{
                    valString = sqlString.escape(val);
                }

                set.push(`${sqlString.escapeId(col)} = ${valString}`);
            }
            syntax.push(set.join(', '))
        }

        return syntax.join(' ');
    }

    async execute(run: QueryFunction): Promise<Insert.Result> {
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

    export type Result = {
        fieldCount: number,
        affectedRows: number,
        insertId: number,
        info: string,
        serverStatus: number,
        warningStatus: number
    }
}

export namespace Insert {
    export type Stage0<I extends Insert<any, any, any>> = I;
    export type Stage1<I extends Insert<any, any, any>> = Omit<I, 'onDuplicate'>
}