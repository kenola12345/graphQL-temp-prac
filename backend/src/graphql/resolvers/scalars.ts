import { GraphQLScalarType, Kind } from "graphql";

/** DateTime travels as an ISO string; on the server it is a JS Date (what Prisma returns). */
export const DateTime = new GraphQLScalarType<Date, string>({
  name: "DateTime",
  description: "ISO 8601 timestamp",
  serialize: (value) => {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "string") return new Date(value).toISOString();
    throw new TypeError("DateTime cannot serialize this value");
  },
  parseValue: (value) => {
    if (typeof value !== "string") throw new TypeError("DateTime must be an ISO string");
    return new Date(value);
  },
  parseLiteral: (ast) => {
    if (ast.kind !== Kind.STRING) throw new TypeError("DateTime must be an ISO string");
    return new Date(ast.value);
  },
});
