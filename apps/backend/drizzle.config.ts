import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/*",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgres://soika_admin:nekorytaylor123@soika.gefest.agency:5432/soika",
  },
});
