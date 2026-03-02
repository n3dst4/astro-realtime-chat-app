import { db } from "@/db";
import * as schema from "@/schemas/chatDB-schema";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { betterAuth } from "better-auth";

// see
// https://github.com/better-auth/better-auth/issues/6766#issuecomment-3704724493
// and
// https://github.com/better-auth/better-auth/pull/6913
// for why we have a funny-lookin' adapter

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite", // or "pg" or "mysql"
    schema,
    usePlural: true,
  }),
  //... the rest of your config
});
