import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./schema/*",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgres://soika_admin:nekorytaylor123@soika.gefest.agency:5432/soika",
    // url: "postgres://soika_admin:nekorytaylor123@localhost:5432/soika",
    // url: "postgres://postgres:password@localhost:5432/postgres",
  },
});
