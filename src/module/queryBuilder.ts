import { functionify, QueryBuilder } from "./queryBuilders/base";
import { FromInsert, Insert, SetInsert } from "./queryBuilders/insert";
import { Select } from "./queryBuilders/select";
import { Union } from "./queryBuilders/union";
import { Update } from "./queryBuilders/update";

const queryBuilder = {
    union: functionify(Union),
    select: functionify(Select),
    update: functionify(Update),
    insert(...[table, duplicateManage]: ConstructorParameters<typeof Insert>) {
        function set(valueRecord: Record<string, any>): SetInsert
        function set(key: string, value: any): SetInsert
        function set(arg1: any, arg2?: any): SetInsert {
            const this_ = new SetInsert(table, duplicateManage);

            if (typeof (arg2) === "undefined") {
                arg1 = arg1 as Record<string, any>;
                Object.entries(arg1).forEach(([key, value]) => {
                    //@ts-expect-error
                    this_.values[key] = value;
                })
            }
            else {
                arg1 = arg1 as string;
                //@ts-expect-error
                this_.values[arg1] = arg2;
            }

            return this_;
        }

        function from(columns: string[], select: QueryBuilder) {
            return new FromInsert(table, columns, select, duplicateManage);
        }

        return {
            set,
            from
        }
    }
} as const;

export default queryBuilder;
export { Select }
export { Insert }
export { Update }

export { QB } from './queryBuilders/base';
export { Where } from './queryBuilders/where';