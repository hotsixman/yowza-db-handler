import { Select } from "./queryBuilders/select";

export const queryBuilder = {
    select(...args: ConstructorParameters<typeof Select>){
        return new Select(...args)
    }
} as const;