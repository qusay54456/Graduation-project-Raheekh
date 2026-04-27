import { Router, type IRouter } from "express";
import { db, spotsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateSpotBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.patch("/spots/:id", async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: "غير مصرح" });
    return;
  }

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "معرّف غير صالح" });
    return;
  }

  const parsed = UpdateSpotBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [spot] = await db
    .update(spotsTable)
    .set({ status: parsed.data.status })
    .where(eq(spotsTable.id, id))
    .returning();

  if (!spot) {
    res.status(404).json({ error: "المقعد غير موجود" });
    return;
  }

  res.json({ id: spot.id, lotId: spot.lotId, spotNumber: spot.spotNumber, status: spot.status });
});

export default router;
