import { int, sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const customersTable = sqliteTable("Customers", {
  CustomerId: int().primaryKey(),
  CompanyName: text().notNull(),
  ContactName: text().notNull(),
  ContactEmail: text().default(""),
});

export const linkShare = sqliteTable("linkShare", {
  id: integer("id").primaryKey({
    autoIncrement: true,
  }),
  url: text("url").notNull(),
  title: text("title").notNull(),
  remark: text("remark"),
  created: integer("created", {
    mode: "timestamp_ms",
  })
    .notNull()
    .$defaultFn(() => new Date()),
  modified: integer("modified", {
    mode: "timestamp_ms",
  })
    .notNull()
    .$defaultFn(() => new Date()),
  deleted: integer("deleted", {
    mode: "timestamp_ms",
  }),
});
