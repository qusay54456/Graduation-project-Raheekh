import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ error: "غير مصرح (Unauthorized)" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "المستخدم غير موجود" });
    return;
  }
  if (user.isBlocked) {
    res.status(403).json({ error: "هذا الحساب محظور (Account is blocked)" });
    return;
  }
  (req as any).user = user;
  next();
}

export async function requireSupervisor(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  await requireAuth(req, res, () => {
    const user = (req as any).user;
    if (user?.role !== "supervisor") {
      res.status(403).json({ error: "تحتاج إلى صلاحيات المشرف (Supervisor required)" });
      return;
    }
    next();
  });
}
