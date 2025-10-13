import { DBSchemaType } from "../QueryBuilder.js";
import { Aggregate } from "./Aggregate.js";
import { And, Or, Where } from "./Where.js";
import { UnionKeys } from "../../../types.js";
import { Raw } from "./Raw.js";
import { Column } from "./Column.js";
import { Value } from "./Value.js";
import { Expression } from "./Expression.js";
import { Compare } from "./Compare.js";
import { CurrentTimestamp, UTC } from "./Time.js";

export function expr<
    SchemaType extends DBSchemaType,
    const Table extends keyof SchemaType & string = keyof SchemaType & string,
    const Column extends keyof SchemaType[Table] & string = UnionKeys<SchemaType[Table]>
>() {
    type ColumnWithTable = Table extends keyof SchemaType ? `${Table}.${keyof SchemaType[Table] & string}` : never;
    return {
        raw(raw: string) {
            return new Raw(raw);
        },
        column(column: Column | ColumnWithTable | (string & {})) {
            return new Column(column);
        },
        value<T>(value: T) {
            return new Value(value);
        },
        count(expr?: Expression) {
            return new Aggregate.Count(expr);
        },
        where(...exprs: Expression[]) {
            return new Where(...exprs);
        },
        and(...exprs: Expression[]) {
            return new And(...exprs);
        },
        or(...exprs: Expression[]) {
            return new Or(...exprs);
        },
        compare(expr1: Expression, operator: Compare.ComparisonOperator, expr2: Expression){
            return new Compare(expr1, operator, expr2);
        },
        now(){
            return new CurrentTimestamp();
        },
        utc(date: Date){
            return new UTC(date);
        }
    }
}

export type Expr<
    SchemaType extends DBSchemaType,
    Table extends keyof SchemaType & string = keyof SchemaType & string,
    Column extends keyof SchemaType[Table] & string = keyof SchemaType[Table] & string
> = ReturnType<typeof expr<
    SchemaType,
    Table,
    Column
>>