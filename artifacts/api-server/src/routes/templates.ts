import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, templatesTable } from "@workspace/db";
import { serializeDates } from "../lib/serialize";
import {
  ListTemplatesResponse,
  CreateTemplateBody,
  GetTemplateParams,
  GetTemplateResponse,
  DeleteTemplateParams,
} from "@workspace/api-zod";

const router: ReturnType<typeof Router> = Router();

router.get("/templates", async (_req, res): Promise<void> => {
  const rows = await db.select().from(templatesTable).orderBy(templatesTable.createdAt);
  res.json(ListTemplatesResponse.parse(serializeDates(rows)));
});

router.post("/templates", async (req, res): Promise<void> => {
  const parsed = CreateTemplateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [template] = await db.insert(templatesTable).values(parsed.data).returning();
  res.status(201).json(GetTemplateResponse.parse(serializeDates(template)));
});

router.get("/templates/:id", async (req, res): Promise<void> => {
  const params = GetTemplateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [template] = await db
    .select()
    .from(templatesTable)
    .where(eq(templatesTable.id, params.data.id));

  if (!template) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  res.json(GetTemplateResponse.parse(serializeDates(template)));
});

router.delete("/templates/:id", async (req, res): Promise<void> => {
  const params = DeleteTemplateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [template] = await db
    .delete(templatesTable)
    .where(eq(templatesTable.id, params.data.id))
    .returning();

  if (!template) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
