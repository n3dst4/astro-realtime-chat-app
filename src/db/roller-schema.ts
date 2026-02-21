import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const Messages = sqliteTable("Messages", {
  id: text()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  user: text().notNull(),
  created_time: int().notNull(),
  formula: text().notNull(),
  result: text().notNull(),
  total: int().notNull(),
});
