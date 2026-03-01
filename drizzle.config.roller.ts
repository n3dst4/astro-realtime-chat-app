import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/roller-schema.ts",
  out: "./src/durable-object-migrations/roller",
  dialect: "sqlite",
  driver: "durable-sqlite",
});
