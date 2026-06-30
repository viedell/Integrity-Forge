import { Router } from "express";
import { eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, gapAnalysesTable } from "@workspace/db";
import { serializeDates } from "../lib/serialize";
import { analyzeResearchGaps } from "../lib/gap_analyzer";
import {
  ListGapAnalysesResponse,
  CreateGapAnalysisBody,
  GetGapAnalysisParams,
  GetGapAnalysisResponse,
  DeleteGapAnalysisParams,
  DeleteGapAnalysisResponse,
} from "@workspace/api-zod";

const router: ReturnType<typeof Router> = Router();

router.get("/gap-analyses", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const clerkId = auth?.userId ?? null;

  const rows = clerkId
    ? await db
        .select()
        .from(gapAnalysesTable)
        .where(eq(gapAnalysesTable.clerkId, clerkId))
        .orderBy(gapAnalysesTable.createdAt)
    : await db.select().from(gapAnalysesTable).orderBy(gapAnalysesTable.createdAt);

  res.json(ListGapAnalysesResponse.parse(serializeDates(rows)));
});

router.post("/gap-analyses", async (req, res): Promise<void> => {
  const parsed = CreateGapAnalysisBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { projectName, papers } = parsed.data;

  // Run the NLP analyzer
  const papersWithId = papers.map((p, idx) => ({
    id: `paper-${Date.now()}-${idx}`,
    title: p.title,
    abstract: p.abstract,
    filename: p.filename || `paper_${idx + 1}.txt`,
  }));

  const analysis = analyzeResearchGaps(papersWithId, projectName);

  const auth = getAuth(req);
  const clerkId = auth?.userId ?? null;

  const [row] = await db
    .insert(gapAnalysesTable)
    .values({
      clerkId,
      projectName,
      papers: papersWithId,
      analysis,
    })
    .returning();

  res.status(201).json(GetGapAnalysisResponse.parse(serializeDates(row)));
});

router.get("/gap-analyses/:id", async (req, res): Promise<void> => {
  const params = GetGapAnalysisParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select()
    .from(gapAnalysesTable)
    .where(eq(gapAnalysesTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Gap analysis not found" });
    return;
  }

  res.json(GetGapAnalysisResponse.parse(serializeDates(row)));
});

router.delete("/gap-analyses/:id", async (req, res): Promise<void> => {
  const params = DeleteGapAnalysisParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .delete(gapAnalysesTable)
    .where(eq(gapAnalysesTable.id, params.data.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Gap analysis not found" });
    return;
  }

  res.json(DeleteGapAnalysisResponse.parse(serializeDates(row)));
});

export default router;
