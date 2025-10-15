import { Delete } from "./Query/Delete.js";
import { Insert } from "./Query/Insert.js";
import { Select } from "./Query/Select.js";
import { Update } from "./Query/Update.js";

type ColumnData = "string" | "number" | "null" | "date";
type TableStructure = {
    [columnName: string]: ColumnData[];
}
export type DBSchema = {
    [tableName: string]: TableStructure;
}

export type ColumnLiteralToType<T extends ColumnData> =
    T extends "string" ? string :
    T extends "number" ? number :
    T extends "null" ? null :
    T extends "date" ? Date :
    never;
export type InferDBSchema<Schema extends DBSchema> = {
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
        const Column extends keyof SchemaType[Table] & string
    >(table: Table) {
        const insert = new Insert<SchemaType, Table, Column>(table);
        return insert as Insert.Stage0<typeof insert>;
    }

    update<
        const Table extends keyof SchemaType & string,
        const Column extends keyof SchemaType[Table] & string
    >(table: Table, value: Update.ValueFunction<SchemaType, Table, Column>) {
        const update = new Update<SchemaType, Table, Column>(table, value);
        return update as Update.Stage0<typeof update>;
    }

    delete<
        const Table extends keyof SchemaType & string,
        const Column extends keyof SchemaType[Table] & string
    >(table: Table, option?: Partial<Delete.Option>) {
        const delete_ = new Delete<SchemaType, Table, Column>(table, option);
        return delete_ as Delete.Stage0<typeof delete_>;
    }

}