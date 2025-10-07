import { functionify, functionifyQueryBuilder } from "./base"

export type Functionify<T extends new (...args: any[]) => any> = ReturnType<typeof functionify>
export type FunctionifyQueryBuilder<T extends new (...args: any[]) => any> = ReturnType<typeof functionifyQueryBuilder<T>>;