import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ticketsTable = pgTable("tickets", {
  id: text("id").primaryKey(),
  segment_json: text("segment_json").notNull(),
  travel_date: text("travel_date").notNull(),
  saved_at: timestamp("saved_at").notNull().defaultNow(),
  status: text("status").notNull().default("active"),
});

export const insertTicketSchema = createInsertSchema(ticketsTable).omit({ saved_at: true });
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof ticketsTable.$inferSelect;
