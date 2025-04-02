import { functionify, QueryBuilder } from "./base";
import * as sqlString from 'sqlstring';

// where 문에 사용할 조건
class Condition {
    toString(): string {
        return '';
    }
}
class ConditionGroup {
    conditions: (Condition | string)[];

    constructor(...conditions: (Condition | string)[]) {
        this.conditions = conditions;
    }

    toString(): string {
        return '';
    }
}

export class Where extends QueryBuilder {
    protected static Class = {
        AND: class extends ConditionGroup {
            toString() {
                return `(${this.conditions.map(e => e.toString()).join(' AND ')})`;
            }
        },
        OR: class extends ConditionGroup {
            toString(): string {
                return `(${this.conditions.map(e => e.toString()).join(' OR ')})`;
            }
        },
        Compare: class extends Condition {
            value1: any;
            value2: any;
            operator: string;

            constructor(value1: any, operator: '=' | '>' | '<' | '>=' | '<=', value2: any, isColumn?: [boolean, boolean]) {
                super();
                isColumn = isColumn ?? [true, false];
                this.value1 = isColumn?.[0] === true ? sqlString.escapeId(value1) : sqlString.escape(value1);
                this.operator = operator;
                this.value2 = isColumn?.[1] === true ? sqlString.escapeId(value2) : sqlString.escape(value2);
            }

            toString(): string {
                return `(${this.value1} ${this.operator} ${this.value2})`;
            }
        },
        Between: class extends Condition {
            value: any;
            left: any;
            right: any;

            constructor(value: any, left: any, right: any, isColumn?: [boolean, boolean, boolean]) {
                super();
                isColumn = isColumn ?? [true, false, false];
                this.value = isColumn?.[0] === true ? sqlString.escapeId(value) : sqlString.escape(value);
                this.left = isColumn?.[1] === true ? sqlString.escapeId(left) : sqlString.escape(left);
                this.right = isColumn?.[2] === true ? sqlString.escapeId(right) : sqlString.escape(right);
            }

            toString(): string {
                return `(${this.value} BETWEEN ${this.left} AND ${this.right})`;
            }
        },
        Like: class extends Condition {
            column: string;
            str: string;

            constructor(column: string, str: string) {
                super();
                this.column = sqlString.escapeId(column);
                this.str = sqlString.escape(str);
            }

            toString(): string {
                return `(${this.column} LIKE ${this.str})`;
            }
        },
        In: class extends Condition {
            column: string;
            values: any[];

            constructor(column: string, values: any[]) {
                super();
                this.column = sqlString.escapeId(column);
                this.values = values.map(e => sqlString.escape(e));
            }

            toString(): string {
                return `(${this.column} IN (${this.values.join(',')}))`;
            }
        },
        Null: class extends Condition{
            column: string;
            constructor(column: string){
                super();
                this.column = column;
            }
            
            toString(): string {
                return `(${sqlString.escapeId(this.column)} IS NULL)`
            }
        },
        NotNull: class extends Condition{
            column: string;
            constructor(column: string){
                super();
                this.column = column;
            }
            
            toString(): string {
                return `(${sqlString.escapeId(this.column)} IS NOT NULL)`
            }
        }
    }
    protected static Condition = Condition;
    protected static ConditionGroup = ConditionGroup;
    static AND = functionify(Where.Class.AND);
    static OR = functionify(Where.Class.OR);
    static Compare = functionify(Where.Class.Compare);
    static Between = functionify(Where.Class.Between);
    static Like = functionify(Where.Class.Like);
    static In = functionify(Where.Class.In);
    static Null = functionify(Where.Class.Null);
    static NotNull = functionify(Where.Class.NotNull);

    protected conditions: (Condition | ConditionGroup | string)[];

    constructor(upper: QueryBuilder | null, ...conditions: (Condition | ConditionGroup | string)[]) {
        super(upper);
        this.conditions = conditions;
    }

    protected toString(): string {
        return `WHERE (${this.conditions.map(condition => condition.toString()).join(' AND ')})`
    }
}