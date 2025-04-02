import { Select } from "./queryBuilders/select";

const queryBuilder = {
    select(...args: ConstructorParameters<typeof Select>){
        return new Select(...args)
    }
} as const;

export default queryBuilder;