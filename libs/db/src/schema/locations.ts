import { sql } from "drizzle-orm";
import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

export const states = pgTable("state", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`), // Changed to UUIDv7
  name: varchar("name").notNull(), // Enforced NOT NULL
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});