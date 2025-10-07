import { Expression } from "./Expression.js";

export class Raw extends Expression {
    raw: string;

    constructor(raw: string) {
        super();
        this.raw = raw;
    }

    toString(): string {
        return this.raw;
    }
}