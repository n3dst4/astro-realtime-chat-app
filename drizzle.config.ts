import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import fs from "fs";

const stringOrCommentRe = /("(?:\\?[^])*?")|(\/\/.*)|(\/\*[^]*?\*\/)/g;
const stringOrTrailingCommaRe = /("(?:\\?[^])*?")|(,\s*)(?=]|})/g;

/* MAIN */

const parseJSONC = (text: string): any => {
  text = String(text); // To be extra safe
  try {
    // Fast path for valid JSON
    return JSON.parse(text);
  } catch {
    // Slow path for JSONC and invalid inputs
    return JSON.parse(
      text
        .replace(stringOrCommentRe, "$1")
        .replace(stringOrTrailingCommaRe, "$1"),
    );
  }
};
const wranglerConfigText = fs.readFileSync("wrangler.jsonc", "utf-8");
const wranglerConfig = parseJSONC(wranglerConfigText);

// "Args":
//
// DATABASE_BINDING should be the value of `binding` in your wrangler d1 config.
// Pass LOCAL=yes when generating migrations to avoid loading the d1 driver

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

const dbConfigs = ENV
  ? wranglerConfig.env[ENV].d1_databases
  : wranglerConfig.d1_databases;

console.log(JSON.stringify(dbConfigs, null, 2));

const dbId = dbConfigs
  .find(({ binding }: any) => binding === DATABASE_BINDING)
  ?.database_id.replaceAll("-", "");

console.log(JSON.stringify(dbId, null, 2));

// following commented code was an attempt to find the db file location for
// running drizzle studio locally. Various sources such as
// https://ygwyg.org/local-d1-drizzle-studio suggest finding the sqlite file by
// using the database id as below, but afaics this no longer works - the
// filenames are obfuscated in some way.
// Find the corresponding local database file

// const localDbDir = ".wrangler/state/v3/d1/miniflare-D1DatabaseObject";
// const LOCAL_DB_PATH = LOCAL
//   ? fs
//       .readdirSync(localDbDir)
//       .filter((f) => f.includes(dbId) && f.endsWith(".sqlite"))
//       .map((f) => ({ file: f, mtime: fs.statSync(`${localDbDir}/${f}`).mtime }))
//       .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
//       .map(({ file }) => `${localDbDir}/${file}`)[0]
//   : undefined;

// console.log(JSON.stringify(LOCAL_DB_PATH, null, 2));

export const localDBPath = "";

export default defineConfig({
  schema: `./src/db/${DATABASE_BINDING}-schema.ts`,
  out: `./migrations/${DATABASE_BINDING}`,
  dialect: "sqlite",
  // driver: "d1-http",
  dbCredentials: {
    databaseId: dbId,
    token: D1_TOKEN,
    accountId: CLOUDFLARE_ACCOUNT_ID,
  },
});
