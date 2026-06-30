import { Router } from "express";
import { eq, and, SQL, isNull } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, submissionsTable, activityTable, usersTable } from "@workspace/db";
import { serializeDates } from "../lib/serialize";
import { detectAI, detectPlagiarism } from "../lib/analyze";
import {
  ListSubmissionsQueryParams,
  ListSubmissionsResponse,
  CreateSubmissionBody,
  GetSubmissionParams,
  GetSubmissionResponse,
  UpdateSubmissionParams,
  UpdateSubmissionBody,
  UpdateSubmissionResponse,
  DeleteSubmissionParams,
  DeleteSubmissionResponse,
} from "@workspace/api-zod";

const router: ReturnType<typeof Router> = Router();

router.get("/submissions", async (req, res): Promise<void> => {
  const params = ListSubmissionsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions: SQL[] = [];
  if (params.data.assignmentId != null) {
    conditions.push(eq(submissionsTable.assignmentId, params.data.assignmentId));
  }
  if (params.data.status != null) {
    conditions.push(eq(submissionsTable.status, params.data.status));
  }

  // If the caller is an authenticated student, scope to their own submissions only
  const auth = getAuth(req);
  let isInstructor = false;
  if (auth?.userId) {
    const [dbUser] = await db.select().from(usersTable).where(eq(usersTable.clerkId, auth.userId));
    if (dbUser?.role === "student") {
      conditions.push(eq(submissionsTable.clerkId, auth.userId));
    } else if (dbUser?.role === "instructor") {
      isInstructor = true;
    }
  }

  // Filter out deleted submissions unless includeDeleted is true (only instructors can do this)
  if (isInstructor) {
    if (params.data.includeDeleted !== true) {
      conditions.push(isNull(submissionsTable.deletedAt));
    }
  } else {
    conditions.push(isNull(submissionsTable.deletedAt));
  }

  const rows =
    conditions.length > 0
      ? await db
          .select()
          .from(submissionsTable)
          .where(and(...conditions))
          .orderBy(submissionsTable.createdAt)
      : await db.select().from(submissionsTable).orderBy(submissionsTable.createdAt);

  res.json(ListSubmissionsResponse.parse(serializeDates(rows)));
});

router.post("/submissions", async (req, res): Promise<void> => {
  const parsed = CreateSubmissionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const wordCount = parsed.data.content.trim().split(/\s+/).filter(Boolean).length;

  // Fetch existing submissions for the same assignment to enable plagiarism comparison
  const existingSubmissions = await db
    .select({ content: submissionsTable.content })
    .from(submissionsTable)
    .where(eq(submissionsTable.assignmentId, parsed.data.assignmentId));

  const otherTexts = existingSubmissions.map((s) => s.content);

  const aiScore = detectAI(parsed.data.content);
  const plagiarismScore = detectPlagiarism(parsed.data.content, otherTexts);

  let status = "clean";
  if (aiScore >= 70) status = "flagged_ai";
  else if (plagiarismScore >= 50) status = "flagged_plagiarism";

  const auth = getAuth(req);
  const clerkId = auth?.userId ?? null;

  const [submission] = await db
    .insert(submissionsTable)
    .values({ ...parsed.data, clerkId, wordCount, aiScore, plagiarismScore, status })
    .returning();

  await db.insert(activityTable).values({
    type: "submission",
    description: `${parsed.data.studentName} submitted for pre-check`,
    submissionId: submission.id,
    studentName: parsed.data.studentName,
  });

  res.status(201).json(GetSubmissionResponse.parse(serializeDates(submission)));
});

router.get("/submissions/:id", async (req, res): Promise<void> => {
  const params = GetSubmissionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [submission] = await db
    .select()
    .from(submissionsTable)
    .where(eq(submissionsTable.id, params.data.id));

  if (!submission) {
    res.status(404).json({ error: "Submission not found" });
    return;
  }

  res.json(GetSubmissionResponse.parse(serializeDates(submission)));
});

router.patch("/submissions/:id", async (req, res): Promise<void> => {
  const params = UpdateSubmissionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateSubmissionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [submission] = await db
    .update(submissionsTable)
    .set(parsed.data)
    .where(eq(submissionsTable.id, params.data.id))
    .returning();

  if (!submission) {
    res.status(404).json({ error: "Submission not found" });
    return;
  }

  res.json(UpdateSubmissionResponse.parse(serializeDates(submission)));
});

router.delete("/submissions/:id", async (req, res): Promise<void> => {
  const params = DeleteSubmissionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const auth = getAuth(req);
  let deletedBy = "student";
  if (auth?.userId) {
    const [dbUser] = await db.select().from(usersTable).where(eq(usersTable.clerkId, auth.userId));
    if (dbUser?.role === "instructor") {
      deletedBy = "instructor";
    }
  }

  const [submission] = await db
    .update(submissionsTable)
    .set({
      deletedAt: new Date(),
      deletedBy,
    })
    .where(eq(submissionsTable.id, params.data.id))
    .returning();

  if (!submission) {
    res.status(404).json({ error: "Submission not found" });
    return;
  }

  // Record deletion activity
  await db.insert(activityTable).values({
    type: "submission",
    description: `Submission #${submission.id} was deleted by ${deletedBy}`,
    submissionId: submission.id,
    studentName: submission.studentName,
  });

  res.json(DeleteSubmissionResponse.parse(serializeDates(submission)));
});

export default router;
