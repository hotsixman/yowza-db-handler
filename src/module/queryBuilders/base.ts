export class QueryBuilder {
    upper: QueryBuilder | null = null;

    constructor(upper: QueryBuilder | null) {
        this.upper = upper;
    }

    toString() {
        return '';
    };

    build(): string {
        return (this.upper?.build() ? `${this.upper.build()} ${this.toString()}` : `${this.toString()}`);
    }
}

export function functionify<T extends new (...args: any[]) => any>(class_: T): (...args: ConstructorParameters<T>) => InstanceType<T>{
    return function(...args: ConstructorParameters<T>){
        return new class_(...args);
    }
}