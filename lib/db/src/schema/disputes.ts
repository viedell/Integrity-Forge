import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const disputesTable = pgTable("disputes", {
  id: serial("id").primaryKey(),
  submissionId: integer("submission_id").notNull(),
  studentName: text("student_name").notNull(),
  rationale: text("rationale").notNull(),
  status: text("status").notNull().default("pending"),
  instructorNote: text("instructor_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDisputeSchema = createInsertSchema(disputesTable).omit({
  id: true,
  createdAt: true,
  status: true,
  instructorNote: true,
});
export type InsertDispute = z.infer<typeof insertDisputeSchema>;
export type Dispute = typeof disputesTable.$inferSelect;
