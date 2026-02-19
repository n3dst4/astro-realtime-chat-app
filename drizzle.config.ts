import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import type { Config } from "drizzle-kit";

// export default defineConfig({
//   out: "./drizzle",
//   schema: "./src/db/schema.ts",
//   dialect: "sqlite",
//   driver: "d1-http",
//   dbCredentials: {
//     accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
//     databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
//     token: process.env.CLOUDFLARE_D1_TOKEN!,
//   },
// });

const { LOCAL_DB_PATH, DB_ID, D1_TOKEN, CF_ACCOUNT_ID } = process.env;

// Use better-sqlite driver for local development
export default defineConfig(
  LOCAL_DB_PATH
    ? ({
        schema: "./src/db/schema.ts",
        dialect: "sqlite",
        dbCredentials: {
          url: LOCAL_DB_PATH,
        },
      } satisfies Config)
    : ({
        schema: "./src/db/schema.ts",
        out: "./migrations",
        dialect: "sqlite",
        driver: "d1-http",
        dbCredentials: {
          databaseId: DB_ID!,
          token: D1_TOKEN!,
          accountId: CF_ACCOUNT_ID!,
        },
      } satisfies Config),
);
