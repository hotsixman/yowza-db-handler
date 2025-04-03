import * as sqlString from 'sqlstring';
import { functionifyQueryBuilder, QueryBuilder } from './base.js';
import { Where } from './where.js';
import { Orderby } from './orderby.js';
import { FunctionifyQueryBuilder } from './types.js';

type DeleteOption = {
    lowPriority: boolean;
    quick: boolean;
    ignore: boolean;
}

export class Delete extends QueryBuilder{
    table: string;
    option?: Partial<DeleteOption>;

    constructor(table: string, option?: Partial<DeleteOption>){
        super(null);
        this.table = table;
        if(option){
            this.option = option;
        }
    }

    toString(){
        const syntax = ['DELETE'];
        if(this.option?.lowPriority){
            syntax.push('LOW_PRIORITY');
        }
        if(this.option?.quick){
            syntax.push('QUICK');
        }
        if(this.option?.ignore){
            syntax.push('IGNORE');
        }
        syntax.push('FROM');
        syntax.push(sqlString.escapeId(this.table));
        
        return syntax.join(' ');
    }

    declare where: FunctionifyQueryBuilder<typeof DeleteWhere>
    declare orderby: FunctionifyQueryBuilder<typeof DeleteOrderby>
    declare limit: FunctionifyQueryBuilder<typeof Limit>
}

export class DeleteWhere extends Where{
    declare orderby: FunctionifyQueryBuilder<typeof DeleteOrderby>
    declare limit: FunctionifyQueryBuilder<typeof Limit>
}

export class DeleteOrderby extends Orderby{
    declare limit: FunctionifyQueryBuilder<typeof Limit>
}

export class Limit extends QueryBuilder{
    limit: number;

    constructor(upper: QueryBuilder, limit: number){
        super(upper);
        this.limit = limit;
    }

    protected toString(): string {
        return `LIMIT ${this.limit}`
    }
}

Delete.prototype.where = functionifyQueryBuilder(DeleteWhere);
Delete.prototype.orderby = functionifyQueryBuilder(DeleteOrderby);
Delete.prototype.limit = functionifyQueryBuilder(Limit);

DeleteWhere.prototype.orderby = functionifyQueryBuilder(DeleteOrderby);
DeleteWhere.prototype.limit = functionifyQueryBuilder(Limit);

DeleteOrderby.prototype.limit = functionifyQueryBuilder(Limit);