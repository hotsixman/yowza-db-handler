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
    static __class = {
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
            value1: any; // 기본적으로 column
            value2: any; // 기본적으로 value
            operator: string;

            /**
             * @param value1 Column by default. Use `Qb.Raw`, `Qb.Value` to use raw string or value.
             * @param operator 
             * @param value2 Value by default. Use `Qb.Raw`, `Qb.Column` to use raw string or column.
             */
            constructor(value1: any, operator: '=' | '>' | '<' | '>=' | '<=', value2: any) {
                super();
                this.value1 = value1;
                this.operator = operator;
                this.value2 = value2;
            }

            toString(): string {
                let value1Str: string;
                let value2Str: string;

                if(this.value1 instanceof QueryBuilder._class.escape.Escape || this.value1 instanceof QueryBuilder._class.aggregate.Aggregate){
                    value1Str = this.value1.toString()
                }
                else{
                    value1Str = sqlString.escapeId(this.value1);
                }
                if(this.value2 instanceof QueryBuilder._class.escape.Escape || this.value2 instanceof QueryBuilder._class.aggregate.Aggregate){
                    value2Str = this.value2.toString();
                }
                else{
                    value2Str = sqlString.escape(this.value2);
                }

                return `(${value1Str} ${this.operator} ${value2Str})`;
            }
        },
        Between: class extends Condition {
            value: any;
            left: any;
            right: any;

            /**
             * @param value Column by default. Use `Qb.Raw`, `Qb.Value` to use raw string or value.
             * @param left Value by default. Use `Qb.Raw`, `Qb.Column` to use raw string or column.
             * @param right Value by default. Use `Qb.Raw`, `Qb.Column` to use raw string or column.
             */
            constructor(value: any, left: any, right: any) {
                super();
                this.value = value;
                this.left = left;
                this.right = right;
            }

            toString(): string {
                if(this.value instanceof QueryBuilder._class.escape.Escape || this.value instanceof QueryBuilder._class.aggregate.Aggregate){
                    var valueStr = this.value.toString()
                }
                else{
                    var valueStr = sqlString.escapeId(this.value);
                }
                if(this.left instanceof QueryBuilder._class.escape.Escape || this.left instanceof QueryBuilder._class.aggregate.Aggregate){
                    var leftStr = this.left.toString()
                }
                else{
                    var leftStr = sqlString.escape(this.left);
                }
                if(this.right instanceof QueryBuilder._class.escape.Escape || this.right instanceof QueryBuilder._class.aggregate.Aggregate){
                    var rightStr = this.right.toString()
                }
                else{
                    var rightStr = sqlString.escape(this.right);
                }

                return `(${valueStr} BETWEEN ${leftStr} AND ${rightStr})`;
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
            values: any[] | QueryBuilder;

            constructor(column: string, values: any[] | QueryBuilder) {
                super();
                this.column = column;
                this.values = values;
            }

            toString(): string {
                if(this.values instanceof QueryBuilder){
                    return `(${sqlString.escapeId(this.column)} IN (${this.values.build()}))`
                }
                else{
                    return `(${sqlString.escapeId(this.column)} IN (${this.values.map(e => sqlString.escape(e)).join(',')}))`
                }
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
    static AND = functionify(Where.__class.AND);
    static OR = functionify(Where.__class.OR);
    static Compare = functionify(Where.__class.Compare);
    static Between = functionify(Where.__class.Between);
    static Like = functionify(Where.__class.Like);
    static In = functionify(Where.__class.In);
    static Null = functionify(Where.__class.Null);
    static NotNull = functionify(Where.__class.NotNull);

    protected conditions: (Condition | ConditionGroup | string)[];

    constructor(upper: QueryBuilder | null, ...conditions: (Condition | ConditionGroup | string)[]) {
        super(upper);
        this.conditions = conditions;
    }

    protected toString(): string {
        return `WHERE (${this.conditions.map(condition => condition.toString()).join(' AND ')})`
    }
}