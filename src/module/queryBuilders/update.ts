import { functionify, functionifyQueryBuilder, QueryBuilder } from "./base.js";
import { Where } from "./where.js";
import { Orderby } from "./orderby.js";
import { FunctionifyQueryBuilder } from "./types.js";
import sqlString from 'sqlstring';

export class Update extends QueryBuilder {
    values: Record<string, any> = {};
    table: string;

    constructor(table: string, values?: Record<string, any>){
        super(null);
        this.table = table;
        if(values){
            this.values = values;
        }
    }

    set(values: Record<string, any>): this;
    set(column: string, value: any): this;
    set(arg1: Record<string, any> | string, arg2?: any){
        if(arg2){
            this.values[arg1 as string] = arg2;
        }
        else{
            Object.entries(arg1).forEach(([column, value]) => {
                this.values[column] = value;
            })
        }
        return this;
    }

    toString(): string {
        const syntax = ["UPDATE"]
        syntax.push(sqlString.escapeId(this.table));
        syntax.push("SET");

        const set: string[] = [];
        Object.entries(this.values).forEach(([column, value]) => {
            if(value instanceof QueryBuilder){
                set.push(`${sqlString.escapeId(column)} = (${value.build()})`)
            }
            else if(value instanceof Update._class.escape.Escape){
                set.push(`${sqlString.escapeId(column)} = ${value.toString()}`)
            }
            else{
                set.push(`${sqlString.escapeId(column)} = ${sqlString.escape(value)}`)
            }
        })
        syntax.push(set.join(', '));

        return syntax.join(' ');
    }

    declare where: FunctionifyQueryBuilder<typeof UpdateWhere>
    declare orderby: FunctionifyQueryBuilder<typeof UpdateOrderby>
    declare limit: FunctionifyQueryBuilder<typeof Limit>
}

class UpdateWhere extends Where{
    declare orderby: FunctionifyQueryBuilder<typeof UpdateOrderby>
    declare limit: FunctionifyQueryBuilder<typeof Limit>
}

class UpdateOrderby extends Orderby{
    declare limit: FunctionifyQueryBuilder<typeof Limit>
}

class Limit extends QueryBuilder{
    limit: number;
    
    constructor(upper:QueryBuilder, limit: number){
        super(upper);
        this.limit = limit;
    }

    protected toString(): string {
        return `LIMIT ${this.limit}`
    }
}

Update.prototype.where = functionifyQueryBuilder(UpdateWhere);
Update.prototype.orderby = functionifyQueryBuilder(UpdateOrderby);
Update.prototype.limit = functionifyQueryBuilder(Limit);

UpdateWhere.prototype.orderby = functionifyQueryBuilder(UpdateOrderby);
UpdateWhere.prototype.limit = functionifyQueryBuilder(Limit);

UpdateOrderby.prototype.limit = functionifyQueryBuilder(Limit);