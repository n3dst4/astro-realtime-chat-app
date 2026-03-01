import {
  getIdForD1Binding,
  getLocalPathForD1Binding,
} from "./scripts/d1Helpers";
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// "Args":
//
// DATABASE_BINDING should be the value of `binding` in your wrangler d1 config.
// Pass LOCAL=yes when generating migrations to avoid loading the d1 driver, or
// when launching drizzle studio on local.
// Pass ENV to work in a particular cloudflare environment

const { DATABASE_BINDING, LOCAL, ENV, D1_TOKEN, CLOUDFLARE_ACCOUNT_ID } =
  process.env;

if (!CLOUDFLARE_ACCOUNT_ID) {
  console.error("CLOUDFLARE_ACCOUNT_ID environment variable is not set");
  process.exit(1);
}

if (!D1_TOKEN) {
  console.error("D1_TOKEN environment variable is not set");
  process.exit(1);
}

if (!DATABASE_BINDING) {
  console.error("DATABASE_BINDING environment variable is not set");
  process.exit(1);
}

export default defineConfig({
  schema: `./src/db/${DATABASE_BINDING}-schema.ts`,
  out: `./migrations/${DATABASE_BINDING}`,
  dialect: "sqlite",
  ...(LOCAL
    ? {
        dbCredentials: {
          url: getLocalPathForD1Binding(DATABASE_BINDING),
        },
      }
    : {
        driver: "d1-http",
        dbCredentials: {
          databaseId: getIdForD1Binding(DATABASE_BINDING, ENV),
          token: D1_TOKEN,
          accountId: CLOUDFLARE_ACCOUNT_ID,
        },
      }),
});
