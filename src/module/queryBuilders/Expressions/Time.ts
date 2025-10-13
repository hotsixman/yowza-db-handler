import { Expression } from "./Expression";
import { DateTime, Zone } from "luxon";

export class CurrentTimestamp extends Expression {
    protected type = 'currentTimestamp';

    toString(): string {
        return `CURRENT_TIMESTAMP()`
    }
}

export class UTC extends Expression {
    protected type = 'date';

    date: Date;

    constructor(date: Date) {
        super();
        this.date = date;
    }

    toString(): string {
        return `'${DateTime.fromJSDate(this.date, {zone: '+00:00'}).toFormat("yyyy-MM-dd HH:mm:ss.SSS")}+00:00'`
    }
}