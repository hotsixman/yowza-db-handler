import { functionify, QueryBuilder } from "./base";
import * as sqlString from 'sqlstring';
import { Where } from "./where"

// select 문
type SelectOption = {
    as: string;
    mode: 'all' | 'distinct';
}
export class Select extends QueryBuilder {
    private static Class = {
        Count: class {
            column: string | null;

            constructor(column?: string) {
                column ? this.column = column : this.column = null;
            }

            toString() {
                return `COUNT(${this.column ? sqlString.escapeId(this.column) : '*'})`
            }
        },
        As: class {
            column: string | InstanceType<typeof Select['Class']['Count']>;
            alias: string;

            constructor(column: string | InstanceType<typeof Select['Class']['Count']>, alias: string) {
                this.column = column;
                this.alias = alias;
            }

            toString() {
                const column = typeof(this.column) === "string" ? sqlString.escapeId(this.column) : this.column.toString();
                const alias = sqlString.escapeId(this.alias);

                return `${column} AS ${alias}`;
            }
        }
    }
    static Count = functionify(this.Class.Count)
    static As = functionify(this.Class.As)

    columns: (string | InstanceType<(typeof Select)['Class']['Count'] | (typeof Select)['Class']['As']>)[] | '*';
    table: string;
    as: string = '';
    mode: 'all' | 'distinct';

    constructor(table: string, columns?: Select['columns'], option?: Partial<SelectOption>) {
        super(null);
        this.table = table;
        if (columns) {
            this.columns = columns;
        }
        else {
            this.columns = '*';
        }
        
        if(option?.as){
            this.as = option?.as;
        }
        this.mode = option?.mode ?? 'all';
    }

    toString() {
        const columns = this.columns === "*" ? "*" : this.columns.map(e => typeof(e) === "string" ? sqlString.escapeId(e) : e.toString()).join(', ');
        const mode = this.mode.toUpperCase();
        const table = sqlString.escapeId(this.table);
        const as = this.as ? `AS ${sqlString.escapeId(this.as)}` : this.as;

        return `SELECT ${mode} ${columns} FROM ${table} ${as}`.trim();
    }

    join(table: string, joinType: JoinType, option: JoinOption, as?: string) {
        return new Join(this, table, joinType, option, as);
    }

    where(...conditions: ConstructorParameters<typeof SelectWhere>[1]) {
        return new SelectWhere(this, conditions);
    }
}

// join
type JoinType = 'inner' | 'left' | 'right' | 'cross' | 'natural' | 'straight';
type JoinOption = ['on', string, string] | ['using', string]
class Join extends QueryBuilder {
    declare upper: Select;
    table: string;
    type: JoinType;
    option: JoinOption;
    as?: string;
    constructor(upper: Select, table: string, joinType: JoinType, option: JoinOption, as?: string) {
        super(upper);
        this.table = table;
        this.type = joinType;
        this.option = option;
        this.as = as;
    }

    toString() {
        const type = this.type.toUpperCase();
        const table = sqlString.escapeId(this.table);
        const as = this.as ? `AS ${sqlString.escapeId(this.as)}` : '';
        const last = this.option[0] === 'on' ? `ON ${sqlString.escapeId(this.upper.as || this.upper.table)}.${sqlString.escapeId(this.option[1])} = ${sqlString.escapeId(this.as || this.table)}.${sqlString.escapeId(this.option[2])}` : `USING (${sqlString.escapeId(this.option[1])})`;
        return `${type} JOIN ${table} ${as} ${last}`;
    }

    where(...conditions: ConstructorParameters<typeof SelectWhere>[1]) {
        return new SelectWhere(this, conditions);
    }
}

// where
class SelectWhere extends Where {}