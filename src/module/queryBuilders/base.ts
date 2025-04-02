import { Tail } from "../../types";

export class QueryBuilder {
    protected upper: QueryBuilder | null = null;

    constructor(upper: QueryBuilder | null) {
        this.upper = upper;
    }

    protected toString() {
        return '';
    };

    build(): string {
        const querys: string[] = [];
        if(this.upper){
            querys.push(this.upper.build());
        }
        querys.push(this.toString());
        return querys.join(' ');
    }
}

export function functionify<T extends new (...args: any[]) => any>(class_: T): (...args: ConstructorParameters<T>) => InstanceType<T>{
    return function(...args: ConstructorParameters<T>){
        return new class_(...args);
    }
}

export function functionifyQueryBuilder<T extends new (...args: any[]) => any>(q: T): (...args: Tail<ConstructorParameters<T>>) => InstanceType<T>{
    return function(...args: Tail<ConstructorParameters<T>>){
        // @ts-expect-error
        return new q(this, ...args)
    }
}