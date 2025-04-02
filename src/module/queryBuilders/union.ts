import { QueryBuilder } from "./base";
import { Select } from "./select";

export class Union extends QueryBuilder{
    protected subQuerys: (Select | Union)[];
    protected all: boolean = false;

    constructor(subQuerys: Union['subQuerys'], option?: {all?: true}){
        super(null);
        this.subQuerys = subQuerys;

        if(option?.all){
            this.all = option.all;
        }
    }

    protected toString(): string {
        return this.subQuerys.map(e => e instanceof Select ? `(${e.build()})` : e.build()).join(this.all ? ' UNION ALL ' : ' UNION ');
    }
}