import { pgTable, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const similarityEdgesTable = pgTable("similarity_edges", {
  id: serial("id").primaryKey(),
  sourceSubmissionId: integer("source_submission_id").notNull(),
  targetSubmissionId: integer("target_submission_id").notNull(),
  similarityScore: real("similarity_score").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSimilarityEdgeSchema = createInsertSchema(similarityEdgesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertSimilarityEdge = z.infer<typeof insertSimilarityEdgeSchema>;
export type SimilarityEdge = typeof similarityEdgesTable.$inferSelect;
