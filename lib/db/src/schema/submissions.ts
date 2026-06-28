import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const submissionsTable = pgTable("submissions", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id"),
  assignmentId: integer("assignment_id").notNull(),
  studentName: text("student_name").notNull(),
  studentEmail: text("student_email"),
  content: text("content").notNull(),
  status: text("status").notNull().default("pending"),
  aiScore: real("ai_score").notNull().default(0),
  plagiarismScore: real("plagiarism_score").notNull().default(0),
  wordCount: integer("word_count"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSubmissionSchema = createInsertSchema(submissionsTable).omit({
  id: true,
  createdAt: true,
  status: true,
  aiScore: true,
  plagiarismScore: true,
  wordCount: true,
});
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissionsTable.$inferSelect;
