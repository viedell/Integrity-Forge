import { Router } from "express";
import { eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { z } from "zod";
import { serializeDates } from "../lib/serialize";

const router: ReturnType<typeof Router> = Router();

const SetRoleBody = z.object({
  role: z.enum(["student", "instructor", "admin"]),
  name: z.string().min(1),
  email: z.string().email(),
});

router.get("/me", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, auth.userId));

  if (!user) {
    res.json({ clerkId: auth.userId, role: null });
    return;
  }

  res.json(serializeDates(user));
});

router.post("/me", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = SetRoleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, auth.userId));

  if (existing) {
    const [updated] = await db
      .update(usersTable)
      .set({ role: parsed.data.role, name: parsed.data.name, email: parsed.data.email })
      .where(eq(usersTable.clerkId, auth.userId))
      .returning();
    res.json(serializeDates(updated));
    return;
  }

  const [user] = await db
    .insert(usersTable)
    .values({ clerkId: auth.userId, ...parsed.data })
    .returning();

  res.status(201).json(serializeDates(user));
});

export default router;
