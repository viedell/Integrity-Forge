import { Router } from "express";
import { sql } from "drizzle-orm";
import { db, submissionsTable, disputesTable, assignmentsTable, activityTable } from "@workspace/db";
import { serializeDates } from "../lib/serialize";
import {
  GetDashboardStatsResponse,
  ListActivityQueryParams,
  ListActivityResponse,
} from "@workspace/api-zod";

const router: ReturnType<typeof Router> = Router();

router.get("/stats", async (_req, res): Promise<void> => {
  const [submissionStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      clean: sql<number>`count(*) filter (where status = 'clean')::int`,
      flaggedAi: sql<number>`count(*) filter (where status = 'flagged_ai')::int`,
      flaggedPlagiarism: sql<number>`count(*) filter (where status = 'flagged_plagiarism')::int`,
    })
    .from(submissionsTable);

  const [disputeStats] = await db
    .select({
      pending: sql<number>`count(*) filter (where status = 'pending')::int`,
      approved: sql<number>`count(*) filter (where status = 'approved')::int`,
      rejected: sql<number>`count(*) filter (where status = 'rejected')::int`,
    })
    .from(disputesTable);

  const [assignmentStats] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(assignmentsTable);

  const total = submissionStats?.total ?? 0;
  const flaggedTotal = (submissionStats?.flaggedAi ?? 0) + (submissionStats?.flaggedPlagiarism ?? 0);

  const stats = {
    totalSubmissions: total,
    cleanCount: submissionStats?.clean ?? 0,
    flaggedAiCount: submissionStats?.flaggedAi ?? 0,
    flaggedPlagiarismCount: submissionStats?.flaggedPlagiarism ?? 0,
    disputesPending: disputeStats?.pending ?? 0,
    disputesApproved: disputeStats?.approved ?? 0,
    disputesRejected: disputeStats?.rejected ?? 0,
    totalAssignments: assignmentStats?.total ?? 0,
    aiDetectionRate: total > 0 ? Math.round((flaggedTotal / total) * 100 * 10) / 10 : 0,
  };

  res.json(GetDashboardStatsResponse.parse(stats));
});

router.get("/activity", async (req, res): Promise<void> => {
  const params = ListActivityQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const limit = params.data.limit ?? 20;

  const rows = await db
    .select()
    .from(activityTable)
    .orderBy(sql`${activityTable.createdAt} desc`)
    .limit(limit);

  res.json(ListActivityResponse.parse(serializeDates(rows)));
});

export default router;
