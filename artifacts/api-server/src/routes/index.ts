import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import lotsRouter from "./lots";
import spotsRouter from "./spots";
import reservationsRouter from "./reservations";
import dashboardRouter from "./dashboard";
import profileRouter from "./profile";
import usersRouter from "./users";
import ratingsRouter from "./ratings";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profileRouter);
router.use(lotsRouter);
router.use(spotsRouter);
router.use(reservationsRouter);
router.use(dashboardRouter);
router.use(usersRouter);
router.use(ratingsRouter);
router.use(notificationsRouter);

export default router;
