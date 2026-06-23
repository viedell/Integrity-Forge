import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, disputesTable, submissionsTable, activityTable } from "@workspace/db";
import { serializeDates } from "../lib/serialize";
import {
  ListDisputesQueryParams,
  ListDisputesResponse,
  CreateDisputeBody,
  GetDisputeParams,
  GetDisputeResponse,
  UpdateDisputeParams,
  UpdateDisputeBody,
  UpdateDisputeResponse,
} from "@workspace/api-zod";

const router: ReturnType<typeof Router> = Router();

router.get("/disputes", async (req, res): Promise<void> => {
  const params = ListDisputesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rows =
    params.data.status != null
      ? await db
          .select()
          .from(disputesTable)
          .where(eq(disputesTable.status, params.data.status))
          .orderBy(disputesTable.createdAt)
      : await db.select().from(disputesTable).orderBy(disputesTable.createdAt);

  res.json(ListDisputesResponse.parse(serializeDates(rows)));
});

router.post("/disputes", async (req, res): Promise<void> => {
  const parsed = CreateDisputeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [dispute] = await db.insert(disputesTable).values(parsed.data).returning();

  await db
    .update(submissionsTable)
    .set({ status: "disputed" })
    .where(eq(submissionsTable.id, parsed.data.submissionId));

  await db.insert(activityTable).values({
    type: "dispute",
    description: `${parsed.data.studentName} filed a dispute`,
    submissionId: parsed.data.submissionId,
    studentName: parsed.data.studentName,
  });

  res.status(201).json(GetDisputeResponse.parse(serializeDates(dispute)));
});

router.get("/disputes/:id", async (req, res): Promise<void> => {
  const params = GetDisputeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [dispute] = await db
    .select()
    .from(disputesTable)
    .where(eq(disputesTable.id, params.data.id));

  if (!dispute) {
    res.status(404).json({ error: "Dispute not found" });
    return;
  }

  res.json(GetDisputeResponse.parse(serializeDates(dispute)));
});

router.patch("/disputes/:id", async (req, res): Promise<void> => {
  const params = UpdateDisputeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateDisputeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [dispute] = await db
    .update(disputesTable)
    .set(parsed.data)
    .where(eq(disputesTable.id, params.data.id))
    .returning();

  if (!dispute) {
    res.status(404).json({ error: "Dispute not found" });
    return;
  }

  if (parsed.data.status) {
    await db.insert(activityTable).values({
      type: "dispute",
      description: `Dispute ${parsed.data.status}: ${dispute.studentName}`,
      submissionId: dispute.submissionId,
      studentName: dispute.studentName,
    });
  }

  res.json(UpdateDisputeResponse.parse(serializeDates(dispute)));
});

export default router;
