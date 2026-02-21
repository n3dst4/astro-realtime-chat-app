import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";

export const Messages = sqliteTable("Messages", {
  id: text()
    .primaryKey()
    .$defaultFn(() => nanoid()),
  user: text().notNull(),
  created_time: int().notNull(),
  formula: text().notNull(),
  result: text().notNull(),
  total: int().notNull(),
});
