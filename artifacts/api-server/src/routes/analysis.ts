import { Router } from "express";
import { eq, and, SQL, gte } from "drizzle-orm";
import { db, submissionsTable, similarityEdgesTable } from "@workspace/db";
import { serializeDates } from "../lib/serialize";
import {
  GetSimilarityGraphQueryParams,
  GetSimilarityGraphResponse,
  CreateSimilarityEdgeBody,
} from "@workspace/api-zod";

const router: ReturnType<typeof Router> = Router();

router.get("/similarity-graph", async (req, res): Promise<void> => {
  const params = GetSimilarityGraphQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { assignmentId, threshold } = params.data;
  const minScore = threshold ?? 30;

  // Get relevant submissions
  const submissionRows = assignmentId != null
    ? await db.select().from(submissionsTable).where(eq(submissionsTable.assignmentId, assignmentId))
    : await db.select().from(submissionsTable);

  const submissionIds = new Set(submissionRows.map((s) => s.id));

  // Get edges above threshold
  const edgeConditions: SQL[] = [gte(similarityEdgesTable.similarityScore, minScore)];
  const edgeRows = await db
    .select()
    .from(similarityEdgesTable)
    .where(and(...edgeConditions));

  // Filter edges to only include nodes that are in our submission set
  const relevantEdges = edgeRows.filter(
    (e) => submissionIds.has(e.sourceSubmissionId) && submissionIds.has(e.targetSubmissionId)
  );

  // Only include nodes that are connected (or all if no threshold filtering)
  const connectedIds = new Set<number>();
  relevantEdges.forEach((e) => {
    connectedIds.add(e.sourceSubmissionId);
    connectedIds.add(e.targetSubmissionId);
  });

  const nodes = submissionRows
    .filter((s) => connectedIds.size === 0 || connectedIds.has(s.id))
    .map((s) => ({
      id: `node-${s.id}`,
      submissionId: s.id,
      studentName: s.studentName,
      status: s.status,
    }));

  const edges = relevantEdges.map((e) => ({
    id: e.id,
    sourceSubmissionId: e.sourceSubmissionId,
    targetSubmissionId: e.targetSubmissionId,
    similarityScore: e.similarityScore,
  }));

  res.json(GetSimilarityGraphResponse.parse({ nodes, edges }));
});

router.post("/similarity-edges", async (req, res): Promise<void> => {
  const parsed = CreateSimilarityEdgeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [edge] = await db.insert(similarityEdgesTable).values(parsed.data).returning();
  res.status(201).json(edge);
});

export default router;
