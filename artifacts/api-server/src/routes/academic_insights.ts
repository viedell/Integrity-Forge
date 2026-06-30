import { Router } from "express";
import { eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, academicInsightsTable } from "@workspace/db";
import { serializeDates } from "../lib/serialize";
import { runAcademicInsightPipeline } from "../lib/insight/pipeline";
import {
  ListAcademicInsightsResponse,
  CreateAcademicInsightBody,
  GetAcademicInsightParams,
  GetAcademicInsightResponse,
  DeleteAcademicInsightParams,
  DeleteAcademicInsightResponse,
} from "@workspace/api-zod";

const router: ReturnType<typeof Router> = Router();

router.get("/academic-insights", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const clerkId = auth?.userId ?? null;

  const rows = clerkId
    ? await db
        .select()
        .from(academicInsightsTable)
        .where(eq(academicInsightsTable.clerkId, clerkId))
        .orderBy(academicInsightsTable.createdAt)
    : await db.select().from(academicInsightsTable).orderBy(academicInsightsTable.createdAt);

  res.json(ListAcademicInsightsResponse.parse(serializeDates(rows)));
});

router.post("/academic-insights", async (req, res): Promise<void> => {
  const parsed = CreateAcademicInsightBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { projectName, papers } = parsed.data;

  // Map to PaperInsightInput
  const papersWithId = papers.map((p, idx) => ({
    id: `paper-${Date.now()}-${idx}`,
    title: p.title,
    abstract: p.abstract,
    filename: p.filename || `paper_${idx + 1}.txt`,
    year: p.year ?? undefined
  }));

  const analysis = runAcademicInsightPipeline(papersWithId);

  const auth = getAuth(req);
  const clerkId = auth?.userId ?? null;

  const [row] = await db
    .insert(academicInsightsTable)
    .values({
      clerkId,
      projectName,
      papers: papersWithId,
      analysis,
    })
    .returning();

  res.status(201).json(GetAcademicInsightResponse.parse(serializeDates(row)));
});

router.get("/academic-insights/:id", async (req, res): Promise<void> => {
  const params = GetAcademicInsightParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select()
    .from(academicInsightsTable)
    .where(eq(academicInsightsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Academic insight not found" });
    return;
  }

  res.json(GetAcademicInsightResponse.parse(serializeDates(row)));
});

router.delete("/academic-insights/:id", async (req, res): Promise<void> => {
  const params = DeleteAcademicInsightParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .delete(academicInsightsTable)
    .where(eq(academicInsightsTable.id, params.data.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Academic insight not found" });
    return;
  }

  res.json(DeleteAcademicInsightResponse.parse(serializeDates(row)));
});

export default router;
