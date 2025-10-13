import { Insert } from "./Query/Insert.js";
import { Select } from "./Query/Select.js";

type ColumnData = "string" | "number" | "null" | "date";
type TableStructure = {
    [columnName: string]: ColumnData[];
}
export type DBSchema = {
    [tableName: string]: TableStructure;
}

type ColumnLiteralToType<T extends ColumnData> =
    T extends "string" ? string :
    T extends "number" ? number :
    T extends "null" ? null :
    T extends "date" ? Date :
    never;
type InferDBSchema<Schema extends DBSchema> = {
    [TableName in keyof Schema & string]: {
        [ColumnName in keyof Schema[TableName]]: ColumnLiteralToType<Schema[TableName][ColumnName][number]>
    }
}
export type DBSchemaType = {
    [tableName: string]: {
        [columnName: string]: string | number | null | Date;
    };
}

export class QueryBuilder<const Schema extends DBSchema, SchemaType extends DBSchemaType = InferDBSchema<Schema>> {
    dbSchema: Schema;
    constructor(dbSchema: Schema) {
        this.dbSchema = dbSchema;
    }

    select<
        const Table extends keyof SchemaType & string,
        const Column extends Select.Column<SchemaType, Table>,
        const CF extends Select.ColumnFunction<SchemaType, Table, Column> | '*'
    >(table: Table, columns: CF) {
        const select = new Select<SchemaType, Table, Column, CF, []>(table, columns);
        return select as Select.Stage0<typeof select>;
    }

    insert<
        const Table extends keyof SchemaType & string,
        const Column extends keyof SchemaType[Table] & string,
        const VF extends Insert.ValueFunction<SchemaType, Table, Column>
    >(table: Table, value: VF){
        return new Insert<SchemaType, Table, Column>(table, value);
    }
}