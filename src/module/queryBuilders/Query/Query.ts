import { QueryFunction } from "../../../types";

export abstract class Query {
    protected abstract type: string;
    abstract build(): string;
    abstract execute(run: QueryFunction): Promise<any>;
}