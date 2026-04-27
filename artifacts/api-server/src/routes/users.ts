import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { UpdateUserBody } from "@workspace/api-zod";
import { requireSupervisor } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/dashboard/users", requireSupervisor, async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
  res.json(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone ?? null,
      profilePhotoUrl: u.profilePhotoUrl ?? null,
      isBlocked: u.isBlocked,
      createdAt: u.createdAt.toISOString(),
    })),
  );
});

router.patch("/dashboard/users/:id", requireSupervisor, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "معرّف غير صالح" });
    return;
  }
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (parsed.data.role != null) updates.role = parsed.data.role;
  if (parsed.data.isBlocked != null) updates.isBlocked = parsed.data.isBlocked;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "لا توجد تغييرات" });
    return;
  }

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  if (!user) {
    res.status(404).json({ error: "المستخدم غير موجود" });
    return;
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone ?? null,
    profilePhotoUrl: user.profilePhotoUrl ?? null,
    isBlocked: user.isBlocked,
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;
