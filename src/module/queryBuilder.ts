import { functionify } from "./queryBuilders/base";
import { Select } from "./queryBuilders/select";
import { Union } from "./queryBuilders/union";

const queryBuilder = {
    union: functionify(Union),
    select: functionify(Select)
} as const;

export default queryBuilder;
export { Select }

export { Where } from './queryBuilders/where';