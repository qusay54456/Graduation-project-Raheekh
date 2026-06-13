import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateProfileBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.patch("/profile", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: JSON.parse(parsed.error.message).map((i: any) => `${i.path.join(".")}: ${i.message}`).join(" | ") });
    return;
  }

  const userId = req.session.userId!;
  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (parsed.data.name != null) updates.name = parsed.data.name;
  if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;
  if (parsed.data.profilePhotoUrl !== undefined) updates.profilePhotoUrl = parsed.data.profilePhotoUrl;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "لا توجد تغييرات" });
    return;
  }

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();

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
