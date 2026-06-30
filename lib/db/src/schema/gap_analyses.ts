import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gapAnalysesTable = pgTable("gap_analyses", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id"),
  projectName: text("project_name").notNull(),
  papers: jsonb("papers").notNull().$type<Array<{
    id: string;
    filename?: string;
    title: string;
    abstract: string;
  }>>(),
  analysis: jsonb("analysis").notNull().$type<{
    topics: Array<{ name: string; count: number; papers: string[] }>;
    gaps: Array<{ title: string; description: string; papers: string[]; questions: string[] }>;
    trends: Array<{ name: string; score: number }>;
  }>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGapAnalysisSchema = createInsertSchema(gapAnalysesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertGapAnalysis = z.infer<typeof insertGapAnalysisSchema>;
export type GapAnalysis = typeof gapAnalysesTable.$inferSelect;
