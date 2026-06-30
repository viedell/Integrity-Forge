import { Router, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { z } from "zod";
import { serializeDates } from "../lib/serialize";

const router: ReturnType<typeof Router> = Router();

async function requireAdmin(req: Request, res: Response): Promise<boolean> {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, auth.userId));
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

router.get("/users", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  const users = await db
    .select()
    .from(usersTable)
    .orderBy(usersTable.createdAt);

  res.json(users.map(serializeDates));
});

const PatchRoleBody = z.object({
  role: z.enum(["student", "instructor", "admin"]),
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = PatchRoleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ role: parsed.data.role })
    .where(eq(usersTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(serializeDates(updated));
});

router.delete("/users/:id", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [deleted] = await db
    .delete(usersTable)
    .where(eq(usersTable.id, id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.status(204).end();
});

export default router;
