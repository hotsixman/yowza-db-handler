import { Expression } from "./Expression";

export class CurrentTimestamp extends Expression{
    protected type = 'currentTimestamp';

    toString(): string {
        return `CURRENT_TIMESTAMP()`
    }
}