import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db, assignmentsTable, submissionsTable } from "@workspace/db";
import {
  CreateAssignmentBody,
  GetAssignmentParams,
  ListAssignmentsResponse,
  GetAssignmentResponse,
} from "@workspace/api-zod";
import { serializeDates } from "../lib/serialize";

const router: ReturnType<typeof Router> = Router();

router.get("/assignments", async (req, res): Promise<void> => {
  const rows = await db.select().from(assignmentsTable).orderBy(assignmentsTable.createdAt);

  const withCounts = await Promise.all(
    rows.map(async (a) => {
      const [counts] = await db
        .select({
          submissionCount: sql<number>`count(*)::int`,
          flaggedCount: sql<number>`count(*) filter (where status in ('flagged_ai','flagged_plagiarism','disputed'))::int`,
        })
        .from(submissionsTable)
        .where(eq(submissionsTable.assignmentId, a.id));
      return {
        ...a,
        submissionCount: counts?.submissionCount ?? 0,
        flaggedCount: counts?.flaggedCount ?? 0,
      };
    })
  );

  res.json(ListAssignmentsResponse.parse(serializeDates(withCounts)));
});

router.post("/assignments", async (req, res): Promise<void> => {
  const parsed = CreateAssignmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [assignment] = await db.insert(assignmentsTable).values(parsed.data).returning();
  res.status(201).json(GetAssignmentResponse.parse(serializeDates({ ...assignment, submissionCount: 0, flaggedCount: 0 })));
});

router.get("/assignments/:id", async (req, res): Promise<void> => {
  const params = GetAssignmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [assignment] = await db
    .select()
    .from(assignmentsTable)
    .where(eq(assignmentsTable.id, params.data.id));

  if (!assignment) {
    res.status(404).json({ error: "Assignment not found" });
    return;
  }

  const [counts] = await db
    .select({
      submissionCount: sql<number>`count(*)::int`,
      flaggedCount: sql<number>`count(*) filter (where status in ('flagged_ai','flagged_plagiarism','disputed'))::int`,
    })
    .from(submissionsTable)
    .where(eq(submissionsTable.assignmentId, assignment.id));

  res.json(GetAssignmentResponse.parse(serializeDates({
    ...assignment,
    submissionCount: counts?.submissionCount ?? 0,
    flaggedCount: counts?.flaggedCount ?? 0,
  })));
});

export default router;
