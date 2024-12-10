import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  schemaFilter: ["public"],
  dialect: "postgresql",
  dbCredentials: {
    host: "localhost",
    database: "soika",
    user: "soika_admin",
    password: "nekorytaylor123",
    ssl: false,
  },
} satisfies Config;
