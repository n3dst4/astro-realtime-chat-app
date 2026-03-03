import { db } from "@/db";
import { envOrDie } from "@/lib/envOrDie";
import * as schema from "@/schemas/chatDB-schema";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { betterAuth } from "better-auth";

// see
// https://github.com/better-auth/better-auth/issues/6766#issuecomment-3704724493
// and
// https://github.com/better-auth/better-auth/pull/6913
// for why we have a funny-lookin' adapter

const {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
} = envOrDie([
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
]);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite", // or "pg" or "mysql"
    schema,
    usePlural: true,
  }),

  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
    },
    google: {
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    },
  },
});
