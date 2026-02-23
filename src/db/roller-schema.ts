import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const Messages = sqliteTable("Messages", {
  id: text()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  username: text().notNull(),
  userId: text().notNull(),
  created_time: int().notNull(),
  formula: text(),
  result: text(),
  rolls: text(),
  total: int(),
  text: text(),
});
