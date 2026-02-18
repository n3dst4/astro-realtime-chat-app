import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const customersTable = sqliteTable("Customers", {
  CustomerId: int().primaryKey(),
  CompanyName: text().notNull(),
  ContactName: text().notNull(),
});
