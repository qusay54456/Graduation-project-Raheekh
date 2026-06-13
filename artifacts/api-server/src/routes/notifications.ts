import { Router, type IRouter } from "express";
import type { Response } from "express";
import { requireSupervisor } from "../middlewares/auth";

const router: IRouter = Router();

const subscribers = new Set<Response>();

export function broadcastNewReservation(payload: any): void {
  const data = `event: new-reservation\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of subscribers) {
    try {
      res.write(data);
    } catch {}
  }
}

router.get("/notifications/stream", requireSupervisor, (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();
  res.write(`: connected\n\n`);

  subscribers.add(res);
  const ping = setInterval(() => {
    try {
      res.write(`: ping\n\n`);
    } catch {}
  }, 20000);

  req.on("close", () => {
    clearInterval(ping);
    subscribers.delete(res);
  });
});

export default router;
