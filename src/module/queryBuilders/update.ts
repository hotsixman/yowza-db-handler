import { functionify, QueryBuilder } from "./base";
import * as sqlString from 'sqlstring';

export class Update extends QueryBuilder {
    static Class = {
        Raw: class {
            syntax: string;
            constructor(syntax: string) {
                this.syntax = syntax;
            }
            toString() {
                return this.syntax;
            }
        },
        Column: class {
            column: string;
            constructor(column: string) {
                this.column = column;
            }
            toString() {
                return sqlString.escapeId(this.column);
            }
            [Symbol.toPrimitive](){
                return this.toString();
            }
        }
    }

    static Raw = functionify(this.Class.Raw);
    static Column = functionify(this.Class.Column);
}