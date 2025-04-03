import { Tail } from "../../types.js";
import sqlString from 'sqlstring';

class Escape{
    toString(): string {return ''}
    [Symbol.toPrimitive]() {
        return this.toString();
    }
}
class Aggregate{
    toString(): string {return ''}
    [Symbol.toPrimitive]() {
        return this.toString();
    }
}

export class QueryBuilder {
    static _class = {
        aggregate: {
            Aggregate,
            Count: class extends Aggregate{
                column: string | null;

                constructor(column?: string) {
                    super()
                    column ? this.column = column : this.column = null;
                }

                toString() {
                    return `COUNT(${this.column ? sqlString.escapeId(this.column) : '*'})`
                }
            },
            Sum: class extends Aggregate{
                column: string;

                constructor(column: string) {
                    super();
                    this.column = column;
                }

                toString() {
                    return `SUM(${sqlString.escapeId(this.column)})`;
                }
            },
            Avg: class extends Aggregate{
                column: string;

                constructor(column: string) {
                    super();
                    this.column = column;
                }

                toString() {
                    return `AVG(${sqlString.escapeId(this.column)})`;
                }
            },
            Min: class extends Aggregate{
                column: string;

                constructor(column: string) {
                    super();
                    this.column = column;
                }

                toString() {
                    return `MIN(${sqlString.escapeId(this.column)})`;
                }
            },
            Max: class extends Aggregate{
                column: string;

                constructor(column: string) {
                    super();
                    this.column = column;
                }

                toString() {
                    return `MAX(${sqlString.escapeId(this.column)})`;
                }
            }
        },
        escape: {
            Escape,
            Raw: class extends Escape{
                syntax: string;
                constructor(syntax: string) {
                    super();
                    this.syntax = syntax;
                }
                toString() {
                    return this.syntax;
                }
            },
            Column: class extends Escape{
                column: string;
                constructor(column: string) {
                    super();
                    this.column = column;
                }
                toString() {
                    return sqlString.escapeId(this.column);
                }
            },
            Value: class extends Escape{
                value: any;
                constructor(value: any) {
                    super();
                    this.value = value;
                }
                toString() {
                    return sqlString.escape(this.value);
                }
            }
        }
    }

    static Raw = functionify(this._class.escape.Raw);
    static Column = functionify(this._class.escape.Column);
    static Value = functionify(this._class.escape.Value);
    static Count = functionify(this._class.aggregate.Count)
    static Sum = functionify(this._class.aggregate.Sum)
    static Avg = functionify(this._class.aggregate.Avg)
    static Min = functionify(this._class.aggregate.Min)
    static Max = functionify(this._class.aggregate.Max)


    protected upper: QueryBuilder | null = null;

    constructor(upper: QueryBuilder | null) {
        this.upper = upper;
    }

    protected toString() {
        return '';
    };

    build(): string {
        const querys: string[] = [];
        if (this.upper) {
            querys.push(this.upper.build());
        }
        querys.push(this.toString());
        return querys.join(' ');
    }
}

export { QueryBuilder as QB }

export function functionify<T extends new (...args: any[]) => any>(class_: T): (...args: ConstructorParameters<T>) => InstanceType<T> {
    return function (...args: ConstructorParameters<T>) {
        return new class_(...args);
    }
}

export function functionifyQueryBuilder<T extends new (...args: any[]) => any>(q: T): (...args: Tail<ConstructorParameters<T>>) => InstanceType<T> {
    return function (...args: Tail<ConstructorParameters<T>>) {
        // @ts-expect-error
        return new q(this, ...args)
    }
}