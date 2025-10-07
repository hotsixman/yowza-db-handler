import { functionify, QueryBuilder } from "./base.js";
import sqlString from 'sqlstring';

export class Insert extends QueryBuilder {
    static __class = {
        DuplicateUpdate: class {
            updateTo: Record<string, any>

            constructor(updateTo: Record<string, any>){
                this.updateTo = updateTo;
            }

            toString(){
                const syntax = ["ON DUPLICATE KEY UPDATE"];
                
                const updateSyntax: string[] = [];
                Object.entries(this.updateTo).forEach(([key, value]) => {
                    if(value instanceof QueryBuilder._class.escape.Escape){
                        updateSyntax.push(`${sqlString.escapeId(key)} = ${value.toString()}`);
                    }
                    else{
                        updateSyntax.push(`${sqlString.escapeId(key)} = ${sqlString.escape(value)}`);
                    }
                });
                syntax.push(updateSyntax.join(', '));

                return syntax.join(' ');
            }
        }
    };

    static DuplicateUpdate = functionify(this.__class.DuplicateUpdate);

    protected table: string;
    protected duplicateManage: 'ignore' | 'replace' | InstanceType<typeof Insert['__class']['DuplicateUpdate']> | null = null;

    constructor(table: string, duplicateManage?: Insert['duplicateManage']) {
        super(null);
        this.table = table;
        if (duplicateManage) this.duplicateManage = duplicateManage;
    }

    protected getFirstQuery() {
        if (this.duplicateManage === "ignore") {
            return "INSERT IGNORE INTO";
        }
        else if (this.duplicateManage === "replace") {
            return "REPLACE INTO";
        }
        else {
            return "INSERT INTO"
        }
    }
}

export class SetInsert extends Insert {
    protected values: Record<string, any> = {};

    set(valueRecord: Record<string, any>): SetInsert
    set(key: string, value: any): SetInsert
    set(arg1: any, arg2?: any): SetInsert {
        if (typeof (arg2) === "undefined") {
            arg1 = arg1 as Record<string, any>;
            Object.entries(arg1).forEach(([key, value]) => {
                this.values[key] = value;
            })
        }
        else {
            arg1 = arg1 as string;
            this.values[arg1] = arg2;
        }

        return this;
    }

    toString() {
        const syntax = [this.getFirstQuery()];
        syntax.push(sqlString.escapeId(this.table));

        const columns: string[] = [];
        const values: string[] = [];
        Object.entries(this.values).forEach(([key, value]) => {
            columns.push(sqlString.escapeId(key));
            values.push(sqlString.escape(value));
        })

        syntax.push(`(${columns.join(', ')})`);
        syntax.push('VALUES');
        syntax.push(`(${values.join(', ')})`);

        if(this.duplicateManage instanceof Insert.__class.DuplicateUpdate){
            syntax.push(this.duplicateManage.toString())
        }

        return syntax.join(' ');
    }
}
export class FromInsert extends Insert {
    protected columns: string[];
    protected select: QueryBuilder;

    constructor(table: string, columns: string[], select: QueryBuilder, duplicateManage?: Insert['duplicateManage']) {
        super(table, duplicateManage);
        this.columns = columns;
        this.select = select;
    }

    protected toString(): string {
        const syntax = [this.getFirstQuery()];
        syntax.push(sqlString.escapeId(this.table));
        syntax.push(`(${this.columns.map(e => sqlString.escapeId(e)).join(', ')})`);
        syntax.push(this.select.build());

        if(this.duplicateManage instanceof Insert.__class.DuplicateUpdate){
            syntax.push(this.duplicateManage.toString())
        }

        return syntax.join(' ');
    }
}