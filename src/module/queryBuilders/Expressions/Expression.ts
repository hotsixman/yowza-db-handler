export abstract class Expression {
    private __secret__ = void 0;
    protected abstract type: string;
    constructor() {
        this.__secret__;
    }

    abstract toString(): string;
}