import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/counter-schema.ts",
  out: "./src/durable-object-migrations/counter",
  dialect: "sqlite",
  driver: "durable-sqlite",
});
