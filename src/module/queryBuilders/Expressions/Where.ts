import { Expression } from "./Expression";

export class Where extends Expression{
    protected type = 'where';
    expressions: Expression[];

    constructor(...expressions: Expression[]){
        super();
        this.expressions = expressions;
    }

    toString(): string {
        if(!this.expressions.length) return '';
        const syntax: string[] = ['WHERE'];
        const conditions: string[] = [];
        this.expressions.forEach((expr) => {
            conditions.push(expr.toString());
        });
        syntax.push(conditions.join(' AND '));
        return syntax.join(' ');
    }

    condition(): string {
        if(!this.expressions.length) return '';
        const syntax: string[] = [];
        const conditions: string[] = [];
        this.expressions.forEach((expr) => {
            conditions.push(expr.toString());
        });
        syntax.push(conditions.join(' AND '));
        return syntax.join(' ');
    }
}

export class And extends Expression{
    protected type = 'and';
    expressions: Expression[];

    constructor(...expressions: Expression[]){
        super();
        this.expressions = expressions;
    }

    toString(): string {
        return this.expressions.map((expr) => expr.toString()).join(' AND ');
    }
}

export class Or extends Expression{
    protected type = 'or';
    expressions: Expression[];

    constructor(...expressions: Expression[]){
        super();
        this.expressions = expressions;
    }

    toString(): string {
        return this.expressions.map((expr) => expr.toString()).join(' OR ');
    }
}