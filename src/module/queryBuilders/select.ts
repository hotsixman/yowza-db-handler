import { functionify, functionifyQueryBuilder, QueryBuilder } from "./base";
import * as sqlString from 'sqlstring';
import { Where } from "./where"
import { ValueOf } from "../../types";
import { FunctionifyQueryBuilder } from "./types";

// select 문
type SelectOption = {
    as: string;
    mode: 'all' | 'distinct';
}
export class Select extends QueryBuilder {
    static __class: any = {
        As: class {
            column: string | InstanceType<ValueOf<typeof QueryBuilder['_class']['aggregate']>>;
            alias: string;

            constructor(column: string | InstanceType<ValueOf<typeof QueryBuilder['_class']['aggregate']>>, alias: string) {
                this.column = column;
                this.alias = alias;
            }

            toString() {
                const column = typeof (this.column) === "string" ? sqlString.escapeId(this.column) : this.column.toString();
                const alias = sqlString.escapeId(this.alias);

                return `${column} AS ${alias}`;
            }
        }
    };

    static As = functionify(this.__class.As)

    protected columns: (string | InstanceType<typeof Select['__class']['As']> | InstanceType<ValueOf<typeof QueryBuilder['_class']['aggregate']>>)[] | '*';
    protected table: string;
    protected as: string = '';
    protected mode: 'all' | 'distinct' | null = null;

    constructor(table: string, columns?: Select['columns'], option?: Partial<SelectOption>) {
        super(null);
        this.table = table;
        if (columns) {
            this.columns = columns;
        }
        else {
            this.columns = '*';
        }

        if (option?.as) {
            this.as = option?.as;
        }
        if (option?.mode) {
            this.mode = option.mode;
        }
    }

    toString() {
        const syntax: string[] = ["SELECT"];
        if (this.mode === 'distinct') {
            syntax.push(this.mode.toUpperCase())
        }
        if (this.columns === "*") {
            syntax.push("*");
        }
        else {
            syntax.push(
                this.columns.map(e => {
                    if (typeof (e) === "string") {
                        return sqlString.escapeId(e);
                    }
                    else {
                        return e.toString();
                    }
                }).join(', ')
            )
        }
        syntax.push("FROM");
        syntax.push(sqlString.escapeId(this.table));
        if (this.as) {
            syntax.push(`AS ${sqlString.escapeId(this.as)}`);
        }

        return syntax.join(' ')
    }

    declare join: FunctionifyQueryBuilder<typeof Join>
    declare where: FunctionifyQueryBuilder<typeof SelectWhere>
    declare groupby: FunctionifyQueryBuilder<typeof Groupby>
    declare orderby: FunctionifyQueryBuilder<typeof Orderby>
    declare limit: FunctionifyQueryBuilder<typeof Limit>
}

// join
type JoinType = 'inner' | 'left' | 'right' | 'cross' | 'natural' | 'straight';
type JoinOption = ['on', string, string] | ['using', string]
class Join extends QueryBuilder {
    declare upper: Select;
    protected table: string;
    protected type: JoinType;
    protected option: JoinOption;
    protected as?: string;

    constructor(upper: Select, table: string, joinType: JoinType, option: JoinOption, otherOption?: { as?: string }) {
        super(upper);
        this.table = table;
        this.type = joinType;
        this.option = option;
        if (otherOption?.as) {
            this.as = otherOption.as;
        }
    }

    toString() {
        const syntax: string[] = [];
        syntax.push(this.type.toUpperCase());
        syntax.push('JOIN');
        syntax.push(sqlString.escapeId(this.table));
        if (this.as) {
            syntax.push(`AS ${sqlString.escapeId(this.as)}`);
        }
        if (this.option[0] === 'on') {
            //@ts-expect-error
            const upperAs = this.upper.as; const upperTable = this.upper.table;
            syntax.push(`ON ${sqlString.escapeId(upperAs || upperTable)}.${sqlString.escapeId(this.option[1])} = ${sqlString.escapeId(this.as || this.table)}.${sqlString.escapeId(this.option[2])}`);
        }
        else {
            syntax.push(`USING (${sqlString.escapeId(this.option[1])})`);
        }

        return syntax.join(' ');
    }

    declare where: FunctionifyQueryBuilder<typeof SelectWhere>
    declare groupby: FunctionifyQueryBuilder<typeof Groupby>
    declare orderby: FunctionifyQueryBuilder<typeof Orderby>
    declare limit: FunctionifyQueryBuilder<typeof Limit>
}

// where
class SelectWhere extends Where {
    declare groupby: FunctionifyQueryBuilder<typeof Groupby>
    declare orderby: FunctionifyQueryBuilder<typeof Orderby>
    declare limit: FunctionifyQueryBuilder<typeof Limit>
}

// group by
class Groupby extends QueryBuilder {
    columns: string | string[];
    withRollup: boolean = false;

    constructor(upper: QueryBuilder, columns: string | string[], option?: { withRollup: boolean }) {
        super(upper);
        this.columns = columns;
        if (option?.withRollup) {
            this.withRollup = option.withRollup;
        }
    }

    toString() {
        const syntax: string[] = ["GROUP BY"];
        if (typeof (this.columns) === "string") {
            syntax.push(sqlString.escapeId(this.columns));
        }
        else {
            syntax.push(this.columns.map(e => sqlString.escapeId(e)).join(', '));
        }
        if (this.withRollup) {
            syntax.push("WITH ROLLUP");
        }

        return syntax.join(' ');
    }

    declare having: FunctionifyQueryBuilder<typeof Having>
    declare orderby: FunctionifyQueryBuilder<typeof Orderby>
    declare limit: FunctionifyQueryBuilder<typeof Limit>
}

class Having extends Where {
    protected toString(): string {
        return `HAVING (${this.conditions.map(condition => condition.toString()).join(' AND ')})`
    }

    declare orderby: FunctionifyQueryBuilder<typeof Orderby>
    declare limit: FunctionifyQueryBuilder<typeof Limit>
}

class Orderby extends QueryBuilder {
    protected column: string;
    protected sort: 'asc' | 'desc';

    constructor(upper: QueryBuilder, column: string, sort: Orderby['sort']) {
        super(upper);
        this.column = column;
        this.sort = sort;
    }

    protected toString(): string {
        return `ORDER BY ${sqlString.escapeId(this.column)} ${this.sort.toUpperCase()}`
    }

    declare limit: FunctionifyQueryBuilder<typeof Limit>
}

class Limit extends QueryBuilder {
    protected size: number;
    protected offset: number | null = null;

    constructor(upper: QueryBuilder, arg1: number, arg2?: number) {
        super(upper);

        if (typeof (arg2) === "number") {
            this.offset = arg1;
            this.size = arg2;
        }
        else {
            this.size = arg1;
        }
    }

    protected toString(): string {
        const syntax = ["LIMIT"];
        if (this.offset === null) {
            syntax.push(this.size.toString());
        }
        else {
            syntax.push(`${this.offset}, ${this.size}`)
        }
        return syntax.join(' ');
    }
}

// functionify
Select.prototype.join = functionifyQueryBuilder(Join);
Select.prototype.where = functionifyQueryBuilder(SelectWhere);
Select.prototype.groupby = functionifyQueryBuilder(Groupby);
Select.prototype.orderby = functionifyQueryBuilder(Orderby);
Select.prototype.limit = functionifyQueryBuilder(Limit);

Join.prototype.where = functionifyQueryBuilder(SelectWhere);
Join.prototype.groupby = functionifyQueryBuilder(Groupby);
Join.prototype.orderby = functionifyQueryBuilder(Orderby);
Join.prototype.limit = functionifyQueryBuilder(Limit);

SelectWhere.prototype.groupby = functionifyQueryBuilder(Groupby);
SelectWhere.prototype.orderby = functionifyQueryBuilder(Orderby);
SelectWhere.prototype.limit = functionifyQueryBuilder(Limit);

Groupby.prototype.having = functionifyQueryBuilder(Having);
Groupby.prototype.orderby = functionifyQueryBuilder(Orderby);
Groupby.prototype.limit = functionifyQueryBuilder(Limit);

Having.prototype.orderby = functionifyQueryBuilder(Orderby);
Having.prototype.limit = functionifyQueryBuilder(Limit);

Orderby.prototype.limit = functionifyQueryBuilder(Limit);