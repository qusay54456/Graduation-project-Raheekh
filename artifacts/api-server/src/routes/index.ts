import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import lotsRouter from "./lots";
import spotsRouter from "./spots";
import reservationsRouter from "./reservations";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(lotsRouter);
router.use(spotsRouter);
router.use(reservationsRouter);
router.use(dashboardRouter);

export default router;
