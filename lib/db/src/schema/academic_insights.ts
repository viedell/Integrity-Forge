import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const academicInsightsTable = pgTable("academic_insights", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id"),
  projectName: text("project_name").notNull(),
  papers: jsonb("papers").notNull().$type<Array<{
    id: string;
    filename?: string;
    title: string;
    abstract: string;
    year?: number;
  }>>(),
  analysis: jsonb("analysis").notNull().$type<{
    reliability: Array<{
      paperId: string;
      paperTitle: string;
      score: number;
      reliabilityLevel: string;
      supportingEvidence: Array<{ signal: string; sentence: string }>;
      weaknesses: string[];
      confidence: number;
      explanation: string;
    }>;
    claimNetwork: {
      nodes: Array<{ id: string; label: string; paperId: string; paperTitle: string }>;
      edges: Array<{ sourceClaimId: string; targetClaimId: string; type: "supports" | "extends" | "contradicts"; evidence: string[] }>;
    };
    timeline: Array<{
      year: number;
      papers: string[];
      concepts: string[];
      methodologies: string[];
      findings: string[];
    }>;
  }>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAcademicInsightSchema = createInsertSchema(academicInsightsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAcademicInsight = z.infer<typeof insertAcademicInsightSchema>;
export type AcademicInsight = typeof academicInsightsTable.$inferSelect;
